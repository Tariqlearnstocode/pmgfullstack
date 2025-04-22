import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { Database } from '../../types/supabase';
import { supabaseClient } from '../../lib/supabase/client';
import Papa from 'papaparse';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionType = Database['public']['Tables']['transaction_types']['Row'];
type Property = Database['public']['Tables']['properties']['Row'];
type Tenant = Database['public']['Tables']['tenants']['Row'];

interface MappedTransaction {
  id?: string;
  property_id?: string;
  tenant_id?: string;
  owner_id?: string;
  type_id: string;
  amount: number;
  date: string;
  invoice_number?: string;
  notes?: string;
  is_manual_edit: boolean;
  status?: 'valid' | 'error' | 'warning';
  message?: string;
  // Original CSV fields for reference
  originalData: Record<string, any>;
  // Matching data
  propertyMatch?: Property;
  tenantMatch?: Tenant;
  ownerMatch?: any;
  typeMatch?: TransactionType;
}

interface TransactionImporterProps {
  onImportComplete?: (transactions: Transaction[]) => void;
}

const DEFAULT_MAPPINGS = {
  date: 'Date',
  amount: 'Amount',
  description: 'Description',
  property: 'Property',
  tenant: 'Tenant',
  owner: 'Owner',
  type: 'Type',
  invoice_number: 'Invoice',
  notes: 'Notes',
  category: 'Category'
};

function TransactionImporter({ onImportComplete }: TransactionImporterProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { execute, transactionService } = useApi<Transaction>();
  
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState(DEFAULT_MAPPINGS);
  const [transactions, setTransactions] = useState<MappedTransaction[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importMode, setImportMode] = useState<'tenant' | 'owner'>('tenant');
  const [step, setStep] = useState<'upload' | 'map' | 'preview' | 'confirm'>('upload');

  // Load reference data
  const loadReferenceData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch properties
      const { data: propsData } = await supabaseClient
        .from('properties')
        .select('*');
        
      if (propsData) {
        setProperties(propsData);
      }
      
      // Fetch tenants
      const { data: tenantsData } = await supabaseClient
        .from('tenants')
        .select('*');
        
      if (tenantsData) {
        setTenants(tenantsData);
      }
      
      // Fetch owners
      const { data: ownersData } = await supabaseClient
        .from('owners')
        .select('*');
        
      if (ownersData) {
        setOwners(ownersData);
      }
      
      // Fetch transaction types
      const { data: typesData } = await supabaseClient
        .from('transaction_types')
        .select('*');
      
      if (typesData) {
        setTransactionTypes(typesData);
      }
    } catch (err) {
      console.error('Error loading reference data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, any>[];
        setCsvData(data);
        
        // Extract headers
        if (data.length > 0) {
          setHeaders(Object.keys(data[0]));
          setStep('map');
          loadReferenceData();
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format and try again.');
      }
    });
  };

  // Handle mapping change
  const handleMappingChange = (key: keyof typeof mappings, value: string) => {
    setMappings(prev => ({ ...prev, [key]: value }));
  };

  // Match property by address or other identifiers
  const matchProperty = (row: Record<string, any>): Property | undefined => {
    const propertyField = mappings.property;
    if (!propertyField || !row[propertyField]) return undefined;
    
    const propertyValue = row[propertyField].toString().toLowerCase().trim();
    console.log('Property value from CSV:', propertyValue);
    
    // Try exact match first
    const exactMatch = properties.find(p => 
      p.address.toLowerCase() === propertyValue
    );
    
    if (exactMatch) {
      console.log('Found exact property match:', exactMatch.address);
      return exactMatch;
    }
    
    // Try partial match
    const partialMatches = properties.filter(p => 
      p.address.toLowerCase().includes(propertyValue) || 
      propertyValue.includes(p.address.toLowerCase())
    );
    
    if (partialMatches.length > 0) {
      console.log('Found partial property match:', partialMatches[0].address);
      return partialMatches[0];
    }
    
    // Try matching just by street number and name (e.g. "123 Main St" matches "123 Main Street, Apt 101")
    const streetNumberRegex = /^\s*(\d+)\s+([^,]+)/;
    const inputMatch = propertyValue.match(streetNumberRegex);
    
    if (inputMatch) {
      const streetNumber = inputMatch[1];
      const streetName = inputMatch[2].trim();
      console.log(`Trying to match by street number (${streetNumber}) and name (${streetName})`);
      
      const streetMatches = properties.filter(property => {
        const propertyMatch = property.address.toLowerCase().match(streetNumberRegex);
        if (propertyMatch) {
          const propertyStreetNumber = propertyMatch[1];
          const propertyStreetName = propertyMatch[2].trim();
          return propertyStreetNumber === streetNumber && 
                 (propertyStreetName.includes(streetName) || streetName.includes(propertyStreetName));
        }
        return false;
      });
      
      if (streetMatches.length > 0) {
        console.log('Found property match by street number and name:', streetMatches[0].address);
        return streetMatches[0];
      }
    }
    
    console.log('No property match found');
    return undefined;
  };

  // Match tenant by name or other identifiers
  const matchTenant = (row: Record<string, any>, propertyId?: string): Tenant | undefined => {
    const tenantField = mappings.tenant;
    if (!tenantField || !row[tenantField]) return undefined;
    
    const tenantValue = row[tenantField].toString().toLowerCase().trim();
    console.log('Tenant value from CSV:', tenantValue);
    console.log('Property ID for tenant matching:', propertyId);
    
    // Get filtered tenants based on property if available
    const filteredTenants = propertyId 
      ? tenants.filter(t => t.property_id === propertyId)
      : tenants;
    
    console.log('Potential tenant matches:', filteredTenants.length);
    
    // Try exact match first
    const exactMatch = filteredTenants.find(t => 
      t.name.toLowerCase() === tenantValue ||
      (t.email && t.email.toLowerCase() === tenantValue)
    );
    
    if (exactMatch) {
      console.log('Found exact tenant match:', exactMatch.name);
      return exactMatch;
    }
    
    // Try matching by last name (common in CSVs)
    const lastNameMatches = filteredTenants.filter(tenant => {
      const tenantNameParts = tenant.name.toLowerCase().split(' ');
      const lastName = tenantNameParts[tenantNameParts.length - 1];
      return tenantValue.includes(lastName) || lastName.includes(tenantValue);
    });
    
    if (lastNameMatches.length > 0) {
      console.log('Found tenant match by last name:', lastNameMatches[0].name);
      return lastNameMatches[0];
    }
    
    // Try partial match by any part of name
    const partialMatches = filteredTenants.filter(t => 
      t.name.toLowerCase().includes(tenantValue) || 
      tenantValue.includes(t.name.toLowerCase())
    );
    
    if (partialMatches.length > 0) {
      console.log('Found tenant partial match:', partialMatches[0].name);
      return partialMatches[0];
    }
    
    // If we still don't have a match but have a property, return the first tenant for that property
    if (propertyId && filteredTenants.length > 0) {
      console.log('Using first tenant for property as fallback:', filteredTenants[0].name);
      return filteredTenants[0];
    }
    
    console.log('No tenant match found');
    return undefined;
  };
  
  // Match owner by name or other identifiers
  const matchOwner = (row: Record<string, any>, propertyId?: string): any | undefined => {
    const ownerField = mappings.owner;
    if (!ownerField || !row[ownerField]) return undefined;
    
    const ownerValue = row[ownerField].toString().toLowerCase().trim();
    const filteredOwners = propertyId 
      ? owners.filter(o => {
          // Find properties owned by this owner
          const ownerProps = properties.filter(p => p.owner_id === o.id);
          return ownerProps.some(p => p.id === propertyId);
        })
      : owners;
    
    // Try exact match first
    const exactMatch = filteredOwners.find(o => 
      o.name.toLowerCase() === ownerValue ||
      (o.email && o.email.toLowerCase() === ownerValue)
    );
    
    if (exactMatch) return exactMatch;
    
    // Try partial match by name
    return filteredOwners.find(o => 
      o.name.toLowerCase().includes(ownerValue) || 
      ownerValue.includes(o.name.toLowerCase())
    );
  };

  // Match transaction type by description
  const matchTransactionType = (row: Record<string, any>): TransactionType | undefined => {
    const typeField = mappings.type;
    const descField = mappings.description;
    
    // Create a map of common terms to transaction types for more reliable matching
    const transactionTypeMap: Record<string, string> = {
      'rent': 'Rent Payment',
      'payment': 'Rent Payment',
      'deposit': 'Security Deposit', 
      'security': 'Security Deposit',
      'late': 'Late Fee',
      'fee': 'Late Fee',
      'repair': 'Maintenance',
      'maintenance': 'Maintenance',
      'fix': 'Maintenance',
      'utility': 'Utility Reimbursement',
      'utilities': 'Utility Reimbursement',
      'water': 'Utility Reimbursement',
      'electric': 'Utility Reimbursement',
      'gas': 'Utility Reimbursement',
      'manage': 'Management Fee',
      'management': 'Management Fee',
      'owner': 'Owner Draw',
      'draw': 'Owner Draw',
      'partial': 'Rent Payment'
    };
    
    console.log('Transaction type mapping attempt for row:', row);
    
    // Try using explicit type field first
    if (typeField && row[typeField]) {
      const typeValue = row[typeField].toString().toLowerCase().trim();
      console.log('Type value from CSV:', typeValue);
      
      // Try exact match first
      const exactMatch = transactionTypes.find(t => 
        t.name.toLowerCase() === typeValue
      );
      
      if (exactMatch) {
        console.log('Found exact transaction type match:', exactMatch.name);
        return exactMatch;
      }
      
      // Check if the type contains any of our known terms
      for (const [term, typeName] of Object.entries(transactionTypeMap)) {
        if (typeValue.includes(term)) {
          const mappedType = transactionTypes.find(t => 
            t.name.toLowerCase() === typeName.toLowerCase()
          );
          
          if (mappedType) {
            console.log(`Matched term '${term}' to transaction type:`, mappedType.name);
            return mappedType;
          }
        }
      }
      
      // If no match by term, try partial match
      const match = transactionTypes.find(t => 
        t.name.toLowerCase().includes(typeValue) || 
        typeValue.includes(t.name.toLowerCase())
      );
      
      if (match) {
        console.log('Found partial transaction type match:', match.name);
        return match;
      }
    }
    
    // Otherwise try to infer from description
    if (descField && row[descField]) {
      const descValue = row[descField].toString().toLowerCase().trim();
      console.log('Description value from CSV:', descValue);
      
      // Check if the description contains any of our known terms
      for (const [term, typeName] of Object.entries(transactionTypeMap)) {
        if (descValue.includes(term)) {
          const mappedType = transactionTypes.find(t => 
            t.name.toLowerCase() === typeName.toLowerCase()
          );
          
          if (mappedType) {
            console.log(`Matched description term '${term}' to transaction type:`, mappedType.name);
            return mappedType;
          }
        }
      }
    }
    
    // If we still don't have a match, use notes field for additional clues
    if (mappings.notes && row[mappings.notes]) {
      const notesValue = row[mappings.notes].toString().toLowerCase().trim();
      
      for (const [term, typeName] of Object.entries(transactionTypeMap)) {
        if (notesValue.includes(term)) {
          const mappedType = transactionTypes.find(t => 
            t.name.toLowerCase() === typeName.toLowerCase()
          );
          
          if (mappedType) {
            console.log(`Matched notes term '${term}' to transaction type:`, mappedType.name);
            return mappedType;
          }
        }
      }
    }
    
    // Default to a generic type based on import mode
    if (importMode === 'tenant') {
      const defaultType = transactionTypes.find(t => t.name === 'Rent Payment' || t.name === 'Other Income');
      if (defaultType) {
        console.log('Using default tenant transaction type:', defaultType.name);
        return defaultType;
      }
    } else {
      const defaultType = transactionTypes.find(t => t.name === 'Management Fee' || t.name === 'Owner Draw');
      if (defaultType) {
        console.log('Using default owner charge type:', defaultType.name);
        return defaultType;
      }
    }
    
    console.log('No transaction type match found');
    return undefined;
  };

  // Process the CSV data into transaction objects
  const processData = () => {
    if (!csvData.length) return;
    
    const processed = csvData.map(row => {
      // Match property, tenant, and owner
      const propertyMatch = matchProperty(row);
      const tenantMatch = importMode === 'tenant' ? matchTenant(row, propertyMatch?.id) : undefined;
      const ownerMatch = importMode === 'owner' ? matchOwner(row, propertyMatch?.id) : undefined;
      const typeMatch = matchTransactionType(row);
      
      // Parse amount
      let amount = 0;
      if (mappings.amount && row[mappings.amount]) {
        const amountStr = row[mappings.amount].toString().replace(/[$,()]/g, '');
        // Handle negative amounts (sometimes shown in parentheses or with minus sign)
        const isNegative = amountStr.includes('-') || row[mappings.amount].toString().includes('(');
        amount = parseFloat(amountStr.replace('-', '')) || 0;
        if (isNegative) amount = -amount;
      }
      
      // Parse date
      let date = '';
      if (mappings.date && row[mappings.date]) {
        const dateValue = row[mappings.date];
        try {
          // Try multiple date formats
          let dateObj = new Date(dateValue);
          
          // Handle MM/DD/YYYY format
          if (isNaN(dateObj.getTime()) && typeof dateValue === 'string') {
            const parts = dateValue.split(/[/\-]/);
            if (parts.length === 3) {
              // Try both MM/DD/YYYY and DD/MM/YYYY formats
              dateObj = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
              if (isNaN(dateObj.getTime())) {
                dateObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              }
            }
          }
          
          if (!isNaN(dateObj.getTime())) {
            date = dateObj.toISOString().split('T')[0];
          }
        } catch (err) {
          console.error('Error parsing date:', err);
        }
      }
      
      // Create transaction object
      const transaction: MappedTransaction = {
        property_id: propertyMatch?.id,
        tenant_id: importMode === 'tenant' ? tenantMatch?.id : undefined,
        type_id: typeMatch?.id || '',
        amount,
        date: date || new Date().toISOString().split('T')[0],
        invoice_number: mappings.invoice_number ? row[mappings.invoice_number] : undefined,
        notes: mappings.notes ? row[mappings.notes] : undefined,
        is_manual_edit: false,
        originalData: row,
        propertyMatch,
        tenantMatch,
        typeMatch
      };
      
      // Validate transaction based on import mode
      if (!transaction.property_id) {
        transaction.status = 'error';
        transaction.message = 'No property match found';
      } else if (!transaction.type_id) {
        transaction.status = 'error';
        transaction.message = 'No transaction type identified';
      } else if (importMode === 'tenant' && !transaction.tenant_id) {
        transaction.status = 'warning';
        transaction.message = 'No tenant match found';
      } else if (importMode === 'owner' && !ownerMatch) {
        transaction.status = 'warning';
        transaction.message = 'No owner match found';
      } else if (!amount) {
        transaction.status = 'warning';
        transaction.message = 'Invalid or zero amount';
      } else if (!date) {
        transaction.status = 'warning';
        transaction.message = 'Invalid date format';
      } else {
        transaction.status = 'valid';
      }
      
      return transaction;
    });
    
    setTransactions(processed);
    setStep('preview');
  };

  // Handle manual correction of a transaction - called when Edit button is clicked
  const updateTransaction = (index: number, updates: Partial<MappedTransaction>) => {
    setTransactions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...updates };
      
      // Revalidate
      const transaction = updated[index];
      if (!transaction.property_id) {
        transaction.status = 'error';
        transaction.message = 'No property match found';
      } else if (!transaction.type_id) {
        transaction.status = 'error';
        transaction.message = 'No transaction type identified';
      } else if (importMode === 'tenant' && !transaction.tenant_id) {
        transaction.status = 'warning';
        transaction.message = 'No tenant match found';
      } else if (importMode === 'owner') {
        // For owner mode, we'll set the owner_id during import based on property
        const property = properties.find(p => p.id === transaction.property_id);
        if (!property || !property.owner_id) {
          transaction.status = 'warning';
          transaction.message = 'Property has no owner assigned';
        } else {
          transaction.status = 'valid';
          transaction.message = undefined;
        }
      } else if (!transaction.amount) {
        transaction.status = 'warning';
        transaction.message = 'Invalid or zero amount';
      } else if (!transaction.date) {
        transaction.status = 'warning';
        transaction.message = 'Invalid date format';
      } else {
        transaction.status = 'valid';
        transaction.message = undefined;
      }
      
      return updated;
    });
  };

  // Import the transactions
  const importTransactions = async () => {
    try {
      setImportLoading(true);
      
      // Filter out invalid transactions
      const validTransactions = transactions.filter(t => t.status !== 'error');
      
      if (validTransactions.length === 0) {
        alert('No valid transactions to import');
        return;
      }
      
      // For owner mode, we need to get owner_id for each transaction based on the property
      let transactionsToImport = [...validTransactions];
      
      if (importMode === 'owner') {
        // Add owner_id to each transaction
        transactionsToImport = validTransactions.map(transaction => {
          const newTransaction = { ...transaction };
          
          if (transaction.property_id) {
            const property = properties.find(p => p.id === transaction.property_id);
            if (property && property.owner_id) {
              newTransaction.owner_id = property.owner_id;
              // For owner transactions, we don't need a tenant_id
              newTransaction.tenant_id = undefined;
            }
          }
          
          return newTransaction;
        });
      }
      
      // Clean transactions for import (remove UI-specific fields)
      const cleanedTransactions = transactionsToImport.map(({ 
        originalData, status, message, propertyMatch, tenantMatch, typeMatch, ownerMatch, ...rest 
      }) => rest);
      
      // Log transaction data before import for debugging
      console.log(`Importing ${cleanedTransactions.length} transactions in ${importMode} mode:`, cleanedTransactions);
      
      // Import transactions - database triggers will handle fee calculations
      const importedTransactions = await execute(() => 
        transactionService.bulkCreate(cleanedTransactions as TransactionInsert[])
      );
      
      if (importedTransactions) {
        alert(`Successfully imported ${importedTransactions.length} transactions`);
        if (onImportComplete) {
          onImportComplete(importedTransactions);
        } else {
          navigate('/transactions');
        }
      }
    } catch (err) {
      console.error('Error importing transactions:', err);
      alert('Error importing transactions. Please try again.');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Import Transactions from CSV</h2>
      
      {/* Step 1: Upload CSV */}
      {step === 'upload' && (
        <div className="mb-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Transaction Type</h3>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="importMode"
                  className="form-radio"
                  checked={importMode === 'tenant'}
                  onChange={() => setImportMode('tenant')}
                />
                <span className="ml-2">Tenant Transactions</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="importMode"
                  className="form-radio"
                  checked={importMode === 'owner'}
                  onChange={() => setImportMode('owner')}
                />
                <span className="ml-2">Owner Charges</span>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {importMode === 'tenant' 
                ? 'Import transactions associated with tenants (rent payments, fees, etc.)' 
                : 'Import charges to be applied to property owners'}
            </p>
          </div>
          
          <p className="mb-4 text-gray-600">
            Upload a CSV file containing transaction data. The file should have headers and contain information about properties, 
            {importMode === 'tenant' ? ' tenants,' : ' owners,'} and transaction details.
          </p>
          
          <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Select CSV File
            </button>
            <p className="mt-2 text-sm text-gray-500">or drag and drop a file here</p>
          </div>
        </div>
      )}
      
      {/* Step 2: Map Columns */}
      {step === 'map' && (
        <div className="mb-6">
          <p className="mb-4 text-gray-600">
            Map the columns from your CSV file to the required transaction fields.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(mappings).map(([key, value]) => (
              <div key={key} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {key.replace('_', ' ')}
                </label>
                <select
                  value={value}
                  onChange={(e) => handleMappingChange(key as keyof typeof mappings, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Select Column --</option>
                  {headers.map(header => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          
          {csvData.length > 0 && (
            <div className="overflow-x-auto mb-6">
              <h3 className="text-lg font-medium mb-2">CSV Preview (First 3 Rows)</h3>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map(header => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {csvData.slice(0, 3).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map(header => (
                        <td key={`${rowIndex}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep('upload')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={processData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </div>
        </div>
      )}
      
      {/* Step 3: Preview and Edit */}
      {step === 'preview' && (
        <div className="mb-6">
          <p className="mb-4 text-gray-600">
            Review the matched transactions. Edit any incorrect matches before importing.
            <span className="ml-2 font-medium">
              {importMode === 'tenant' ? 'Tenant Transactions' : 'Owner Charges'} Mode
            </span>
          </p>
          
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
              <span className="text-sm text-gray-600">Valid: {transactions.filter(t => t.status === 'valid').length}</span>
            </div>
            <div className="flex items-center mb-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
              <span className="text-sm text-gray-600">Warning: {transactions.filter(t => t.status === 'warning').length}</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
              <span className="text-sm text-gray-600">Error: {transactions.filter(t => t.status === 'error').length}</span>
            </div>
          </div>
          
          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {importMode === 'tenant' ? 'Tenant' : 'Owner'}
                  </th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction, index) => {
                  // Determine owner name based on property if in owner mode
                  let ownerName = 'Unknown';
                  if (importMode === 'owner' && transaction.property_id) {
                    const property = properties.find(p => p.id === transaction.property_id);
                    if (property && property.owner_id) {
                      const owner = owners.find(o => o.id === property.owner_id);
                      if (owner) ownerName = owner.name;
                    }
                  }
                  
                  return (
                    <tr key={index} className={
                      transaction.status === 'error' ? 'bg-red-50' : 
                      transaction.status === 'warning' ? 'bg-yellow-50' : ''
                    }>
                      <td className="px-2 py-4 whitespace-nowrap">
                        <div className={`w-3 h-3 rounded-full ${
                          transaction.status === 'valid' ? 'bg-green-500' : 
                          transaction.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} title={transaction.message}></div>
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm">
                        {transaction.date}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm">
                        {transaction.propertyMatch?.address || 'Unknown'}
                      </td>
                      <td className="px-2 py-4 whitespace-nowrap text-sm">
                        {importMode === 'tenant' 
                          ? (transaction.tenantMatch?.name || 'Unknown')
                          : ownerName
                        }
                      </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm">
                      {transaction.typeMatch?.name || 'Unknown'}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-sm">

                      <button
                        type="button"
                        onClick={() => {
                          // Open edit dialog or form for this transaction
                          // For now, let's just simulate an edit with a simple prompt
                          const newAmount = prompt('Enter new amount:', transaction.amount.toString());
                          if (newAmount !== null) {
                            const amount = parseFloat(newAmount);
                            if (!isNaN(amount)) {
                              updateTransaction(index, { amount, is_manual_edit: true });
                            }
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep('map')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              disabled={!transactions.some(t => t.status === 'valid')}
            >
              Continue
            </button>
          </div>
        </div>
      )}
      
      {/* Step 4: Confirmation */}
      {step === 'confirm' && (
        <div className="mb-6">
          <div className="bg-yellow-50 p-4 border-l-4 border-yellow-400 mb-6">
            <div className="flex">
              <div className="shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You are about to import {transactions.filter(t => t.status !== 'error').length} transactions. This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Import Summary</h3>
            <p className="mb-1">Total Transactions: {transactions.length}</p>
            <p className="mb-1">Valid Transactions: {transactions.filter(t => t.status === 'valid').length}</p>
            <p className="mb-1">Warnings: {transactions.filter(t => t.status === 'warning').length}</p>
            <p className="mb-1">Errors (will be skipped): {transactions.filter(t => t.status === 'error').length}</p>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep('preview')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={importTransactions}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              disabled={importLoading}
            >
              {importLoading ? 'Importing...' : 'Import Transactions'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionImporter;
