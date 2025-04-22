import { Routes, Route } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import TenantsPage from './pages/TenantsPage';
import TenantDetail from './pages/TenantDetail';
import TenantForm from './pages/TenantForm';
import OwnerForm from './pages/OwnerForm';
import OwnersPage from './pages/OwnersPage';
import OwnerDetail from './pages/OwnerDetail';
import PropertiesPage from './pages/PropertiesPage';
import PropertyForm from './pages/PropertyForm';
import PropertyDetail from './pages/PropertyDetail';
import TransactionsPage from './pages/TransactionsPage';
import TransactionDetail from './pages/TransactionDetail';
import TransactionForm from './pages/TransactionForm';
import TransactionEdit from './pages/TransactionEdit';
import TransactionImport from './pages/TransactionImport';
import ReportsPage from './pages/ReportsPage';
import CustomReportPage from './pages/reports/CustomReportPage';
import TenantLedgerReport from './pages/reports/TenantLedgerReport';
import PropertyDirectoryReport from './pages/reports/PropertyDirectoryReport.tsx';
import OwnerStatementReport from './pages/reports/OwnerStatementReport';
import OwnerStatementSummary from './pages/reports/OwnerStatementSummary';
import Layout from './components/Layout';
import { RequireAuth } from './components/RequireAuth';

function App() {
  return (
    <Routes> 
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="tenants" element={<TenantsPage />} />
        <Route path="tenants/new" element={<TenantForm />} />
        <Route path="tenants/:id" element={<TenantDetail />} />
        <Route path="owners" element={<OwnersPage />} />
        <Route path="owners/new" element={<OwnerForm />} />
        <Route path="owners/:id" element={<OwnerDetail />} />
        <Route path="owners/:id/edit" element={<OwnerForm />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="properties/new" element={<PropertyForm />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="properties/:id/edit" element={<PropertyForm />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="transactions/new" element={<TransactionForm />} />
        <Route path="transactions/import" element={<TransactionImport />} />
        <Route path="transactions/:id" element={<TransactionDetail />} />
        <Route path="transactions/:id/edit" element={<TransactionEdit />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/custom" element={<CustomReportPage />} />
        <Route path="reports/tenant-ledger" element={<TenantLedgerReport />} />
        <Route path="reports/tenant-ledger/:id" element={<TenantLedgerReport />} />
        <Route path="reports/property-directory" element={<PropertyDirectoryReport />} />
        <Route path="reports/owner-statement" element={<OwnerStatementReport />} />
        <Route path="reports/owner-statement-summary" element={<OwnerStatementSummary />} />
      </Route>
    </Routes>
  );
}

export default App;