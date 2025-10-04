import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Layout components
import MainLayout from './components/common/MainLayout';

// Lazy load feature components
const PartyList = lazy(() => import('./components/fabric-income/PartyList'));
const PartyForm = lazy(() => import('./components/fabric-income/PartyFormUpdated'));
const PartyEdit = lazy(() => import('./components/fabric-income/PartyEdit'));
const PartyDetail = lazy(() => import('./components/fabric-income/PartyDetail'));
const StockDashboard = lazy(() => import('./components/stock/StockDashboard'));
const CuttingList = lazy(() => import('./components/cutting/CuttingList'));
const BeforeCuttingForm = lazy(() => import('./components/cutting/BeforeCuttingForm'));
const AfterCuttingForm = lazy(() => import('./components/cutting/AfterCuttingForm'));
const CuttingDetail = lazy(() => import('./components/cutting/CuttingDetail'));
const CuttingStock = lazy(() => import('./components/cutting/CuttingStock'));
const InlineStock = lazy(() => import('./components/cutting/InlineStock'));
const ProcessOutput = lazy(() => import('./components/process/ProcessOutput'));
const OutputReport = lazy(() => import('./components/reports/OutputReport'));

// Delivery components
const DeliveryList = lazy(() => import('./components/delivery/DeliveryList'));
const DeliveryForm = lazy(() => import('./components/delivery/DeliveryForm'));
const DeliveryReport = lazy(() => import('./components/reports/DeliveryReport'));

function App() {
  return (
    <Router>
      <MainLayout>
        <Suspense fallback={<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}>
          <Routes>
            {/* Redirect from root to fabric stock as default */}
            <Route path="/" element={<StockDashboard />} />
            
            {/* Party Routes (formerly Vendor) */}
            <Route path="/fabric-income" element={<PartyList />} />
            <Route path="/fabric-income/new" element={<PartyForm />} />
            <Route path="/fabric-income/:id" element={<PartyDetail />} />
            <Route path="/fabric-income/:id/edit" element={<PartyEdit />} />
            
            {/* Stock Routes */}
            <Route path="/stock" element={<StockDashboard />} />
            
            {/* Cutting Routes */}
            <Route path="/cutting" element={<CuttingList />} />
            <Route path="/cutting/before" element={<BeforeCuttingForm />} />
            <Route path="/cutting/:id/after" element={<AfterCuttingForm />} />
            <Route path="/cutting/:id" element={<CuttingDetail />} />
            <Route path="/cutting/stock" element={<CuttingStock />} />
            <Route path="/cutting/inline-stock" element={<InlineStock />} />
            
            {/* Process Routes */}
            <Route path="/process" element={<ProcessOutput />} />
            <Route path="/process/output" element={<ProcessOutput />} />
            
            {/* Reports Routes */}
            <Route path="/reports" element={<OutputReport />} />
            <Route path="/reports/delivery" element={<DeliveryReport />} />
            
            {/* Delivery Routes */}
            <Route path="/delivery" element={<DeliveryList />} />
            <Route path="/delivery/new" element={<DeliveryForm />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </Router>
  );
}

export default App;
