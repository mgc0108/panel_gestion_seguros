import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchDashboard, setSearchDashboard] = useState('');
  const [searchArchivo, setSearchArchivo] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState({
    id: '', premium: '', category: '', expiresAt: '', issuedAt: '', policyNumber: '', company: '',
    customer: { fullname: '', apellidos: '', dni: '', phone: '', email: '', address: '' }
  });

  const [formData, setFormData] = useState({
    clientName: '', apellidos: '', dni: '', email: '', phone: '', address: '',
    policyNumber: '', category: 'Hogar', premium: '', expiresAt: '', issuedAt: '', company: 'Mapfre'
  });

  const aseguradorasEspana = [
    "Mapfre", "Allianz", "Mutua Madrileña", "AXA", "Generali", "Reale", "Occident (Catalana)", 
    "Línea Directa", "Zurich", "Liberty Seguros", "Caser", "Pelayo", "Ocaso", "Santalucía", 
    "SegurCaixa Adeslas", "Sanitas", "DKV", "Asisa", "FIATC", "Helvetia", "Aegon"
  ].sort();

  const API_URL = 'https://69a1b3d42e82ee536fa2038c.mockapi.io/policies';

  const fetchData = async () => {
    try {
      const res = await axios.get(API_URL);
      setPolicies(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openEditModal = (p) => {
    setEditData({
      id: p.id,
      premium: p.premium || '',
      category: p.category || '',
      policyNumber: p.policyNumber || '',
      company: p.company || 'Mapfre',
      expiresAt: p.expiresAt ? p.expiresAt.substring(0, 10) : '',
      issuedAt: p.issuedAt ? p.issuedAt.substring(0, 10) : '', 
      customer: {
        fullname: p.customer?.fullname || '',
        apellidos: p.customer?.apellidos || '',
        dni: p.customer?.dni || '',
        phone: p.customer?.phone || '',
        email: p.customer?.email || '',
        address: p.customer?.address || ''
      }
    });
    setIsModalOpen(true);
  };

  const handleAction = async (id, action, payload = null) => {
    try {
      if (action === 'delete') {
        if (!window.confirm("¿Confirmar baja definitiva del cliente?")) return;
        await axios.delete(`${API_URL}/${id}`);
      }
      if (action === 'save-update') {
        await axios.patch(`${API_URL}/${id}`, payload);
        setIsModalOpen(false);
      }
      if (action === 'improve') {
        // Al dar a mejorar, cambiamos el estado pero el cliente NO desaparece del panel
        await axios.patch(`${API_URL}/${id}`, { status: 'buscando' });
      }
      if (action === 'renew') {
        const p = policies.find(x => x.id === id);
        const antiguaFecha = p.expiresAt;
        const año = parseInt(antiguaFecha.substring(0,4));
        const nuevaFecha = (año + 1) + antiguaFecha.substring(4);
        
        // Al renovar, el estado vuelve a 'normal' y se actualizan fechas
        await axios.patch(`${API_URL}/${id}`, { 
          issuedAt: antiguaFecha, 
          expiresAt: nuevaFecha, 
          status: 'normal' 
        });
        alert("Póliza renovada correctamente hasta " + nuevaFecha);
      }
      fetchData();
    } catch (e) { alert("Error en la operación"); }
  };

  const filterLogic = (list, query) => {
    return list.filter(p => 
      p.customer?.fullname?.toLowerCase().includes(query.toLowerCase()) ||
      p.customer?.dni?.toLowerCase().includes(query.toLowerCase()) ||
      p.category?.toLowerCase().includes(query.toLowerCase()) ||
      p.company?.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Vencimientos: Mostramos todos los que vencen en 2026 o antes, aunque estemos buscando oferta
  const upcomingPolicies = filterLogic(
    policies.filter(p => parseInt(p.expiresAt.substring(0,4)) <= 2026), 
    searchDashboard
  );
  
  const searchingPolicies = filterLogic(
    policies.filter(p => p.status === 'buscando'), 
    searchDashboard
  );

  if (loading) return <div className="p-20 text-center font-black text-indigo-600 animate-pulse uppercase tracking-widest">InsuranceSync</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 text-slate-900 notranslate" lang="es">
      <header className="bg-indigo-950 text-white p-5 shadow-2xl sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 w-8 h-8 rounded-lg flex items-center justify-center font-bold italic shadow-inner">IS</div>
          <h1 className="text-lg font-black tracking-tighter uppercase">Insurance<span className="text-orange-500">Sync</span></h1>
        </div>
        <nav className="flex gap-2">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'dashboard' ? 'bg-indigo-600' : 'text-indigo-300'}`}>PANEL DE CONTROL</button>
          <button onClick={() => setActiveTab('archivo')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'archivo' ? 'bg-indigo-600' : 'text-indigo-300'}`}>ARCHIVO CLIENTES</button>
        </nav>
        <button onClick={() => setShowForm(!showForm)} className="bg-orange-600 px-4 py-2 rounded-xl font-black text-xs shadow-lg">{showForm ? '✖ CANCELAR' : '＋ NUEVA ALTA'}</button>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        
        {showForm && (
          <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-indigo-100 mb-10 animate-in fade-in slide-in-from-top-4">
             <h2 className="text-xl font-black mb-6 text-indigo-950 uppercase italic border-b-4 border-orange-500 inline-block">Nueva Venta</h2>
             <form onSubmit={async (e) => { 
                e.preventDefault(); 
                const dataToSave = {
                  ...formData, status: 'normal',
                  customer: { 
                    fullname: formData.clientName, apellidos: formData.apellidos, 
                    dni: formData.dni, email: formData.email, phone: formData.phone, address: formData.address 
                  }
                };
                await axios.post(API_URL, dataToSave); 
                setShowForm(false); 
                fetchData(); 
             }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" placeholder="Nombre" className="input-field" onChange={e => setFormData({...formData, clientName: e.target.value})} required />
                <input type="text" placeholder="Apellidos" className="input-field" onChange={e => setFormData({...formData, apellidos: e.target.value})} required />
                <input type="text" placeholder="DNI" className="input-field" onChange={e => setFormData({...formData, dni: e.target.value})} required />
                <input type="text" placeholder="Nº Póliza" className="input-field" onChange={e => setFormData({...formData, policyNumber: e.target.value})} required />
                <select className="input-field font-black text-orange-600" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}>
                  {aseguradorasEspana.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select className="input-field font-bold text-indigo-600" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Hogar">🏠 Hogar</option>
                  <option value="Vehículo">🚗 Vehículo</option>
                  <option value="Vida">💖 Vida</option>
                  <option value="Salud">🏥 Salud</option>
                  <option value="Comercio">🏢 Comercio</option>
                </select>
                <input type="number" placeholder="Prima Anual (€)" className="input-field" onChange={e => setFormData({...formData, premium: e.target.value})} required />
                <input type="email" placeholder="Email" className="input-field" onChange={e => setFormData({...formData, email: e.target.value})} />
                <input type="text" placeholder="Teléfono" className="input-field" onChange={e => setFormData({...formData, phone: e.target.value})} />
                <input type="text" placeholder="Dirección" className="input-field" onChange={e => setFormData({...formData, address: e.target.value})} />
                <div className="flex flex-col"><label className="text-[10px] font-bold text-slate-400 ml-2">ALTA</label>
                <input type="date" className="input-field" onChange={e => setFormData({...formData, issuedAt: e.target.value})} required /></div>
                <div className="flex flex-col"><label className="text-[10px] font-bold text-slate-400 ml-2">VENCIMIENTO</label>
                <input type="date" className="input-field" onChange={e => setFormData({...formData, expiresAt: e.target.value})} required /></div>
                <button type="submit" className="md:col-span-3 bg-indigo-700 text-white py-4 rounded-xl font-black uppercase shadow-xl hover:bg-indigo-800 transition-all mt-2">Registrar en Cartera</button>
             </form>
          </div>
        )}

        {activeTab === 'dashboard' ? (
          <div className="space-y-12">
            {/* BUSCADOR PANEL */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
               <span className="text-lg">🔍</span>
               <input type="text" placeholder="Filtrar próximos vencimientos por nombre, DNI, compañía o tipo..." className="w-full bg-transparent outline-none text-sm font-bold" value={searchDashboard} onChange={(e) => setSearchDashboard(e.target.value)} />
            </div>

            <section>
              <h2 className="text-xl font-black text-slate-800 mb-6 uppercase flex items-center gap-2"><span className="w-2 h-6 bg-red-500 rounded-full"></span> Próximos Vencimientos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingPolicies.map(p => (
                    <div key={p.id} className={`bg-white p-6 rounded-[2rem] shadow-sm border ${p.status === 'buscando' ? 'border-orange-400 border-2' : 'border-slate-100'} hover:shadow-xl transition-all relative`}>
                      {p.status === 'buscando' && <span className="absolute -top-3 left-6 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">En gestión de precio</span>}
                      <div className="mb-4">
                        <div className="flex justify-between items-start">
                          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{p.category}</span>
                          <span className="text-[10px] font-black text-orange-500 uppercase">{p.company}</span>
                        </div>
                        <h3 className="font-black text-xl text-slate-900 uppercase leading-none mt-2">{p.customer?.fullname} {p.customer?.apellidos}</h3>
                        <p className="text-xs font-bold text-slate-400 italic">DNI: {p.customer?.dni}</p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-2xl mb-4 text-center border border-red-100">
                        <p className="text-[10px] font-bold text-red-400 uppercase">Vence el: <span className="text-red-700 font-black">{p.expiresAt}</span></p>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <button onClick={() => handleAction(p.id, 'renew')} className="bg-green-600 text-white py-3 rounded-xl text-xs font-black hover:bg-green-700">RENOVAR PÓLIZA</button>
                        <button onClick={() => handleAction(p.id, 'improve')} className="bg-orange-500 text-white py-3 rounded-xl text-xs font-black hover:bg-orange-600 italic">MEJORAR PRECIO / BUSCAR</button>
                      </div>
                    </div>
                  ))}
                  {upcomingPolicies.length === 0 && <p className="text-slate-400 italic font-bold">No hay vencimientos próximos.</p>}
              </div>
            </section>

            <section className="bg-orange-50/50 p-8 rounded-[3rem] border-2 border-dashed border-orange-200">
              <h2 className="text-xl font-black text-orange-600 mb-6 uppercase flex items-center gap-2"><span className="w-2 h-6 bg-orange-500 rounded-full"></span> Listado para Ofertas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchingPolicies.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-[2rem] shadow-md border-2 border-orange-400">
                    <p className="text-[10px] font-black text-orange-500 mb-1 uppercase tracking-widest">Buscando Nueva Opción</p>
                    <h3 className="font-black text-lg text-slate-900 uppercase">{p.customer?.fullname}</h3>
                    <p className="text-xs font-bold text-slate-400 mb-4">{p.category} | {p.company} ({p.premium}€)</p>
                    <button onClick={() => openEditModal(p)} className="w-full bg-indigo-700 text-white py-3 rounded-xl text-xs font-black hover:bg-indigo-800">APLICAR MEJORA Y MODIFICAR</button>
                  </div>
                ))}
                {searchingPolicies.length === 0 && <p className="text-orange-300 italic font-bold">No hay clientes marcados para mejora de precio.</p>}
              </div>
            </section>
          </div>
        ) : (
          /* VISTA ARCHIVO COMPLETA */
          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200">
            <div className="p-8 bg-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-white">
              <h2 className="font-black italic uppercase text-sm tracking-widest">Cartera de Clientes</h2>
              <input type="text" placeholder="Buscar por DNI, Nombre o Compañía..." className="bg-slate-800 text-white p-3 px-6 rounded-2xl w-full md:w-80 text-sm outline-none border border-slate-700" onChange={(e) => setSearchArchivo(e.target.value)} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b">
                  <tr>
                    <th className="p-6">CLIENTE</th>
                    <th className="p-6">RAMO / COMPAÑÍA</th>
                    <th className="p-6 text-center">VENCIMIENTO</th>
                    <th className="p-6 text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filterLogic(policies, searchArchivo).map(p => (
                    <tr key={p.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="p-6">
                        <p className="font-black text-sm text-slate-800 uppercase">{p.customer?.fullname} {p.customer?.apellidos}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{p.customer?.dni}</p>
                      </td>
                      <td className="p-6">
                        <p className="text-xs font-black text-indigo-600 uppercase">{p.category}</p>
                        <p className="text-[10px] font-bold text-slate-300 uppercase">{p.company}</p>
                      </td>
                      <td className="p-6 text-center font-black text-sm text-slate-600">{p.expiresAt}</td>
                      <td className="p-6 text-center">
                        <button onClick={() => openEditModal(p)} className="px-5 py-2 rounded-xl bg-white text-indigo-600 border border-indigo-100 font-black text-[10px] uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm">Ver Expediente</button>
                        <button onClick={() => handleAction(p.id, 'delete')} className="ml-2 text-red-200 hover:text-red-600 transition-colors text-lg">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FICHA TÉCNICA REESTRUCTURADO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-indigo-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full p-10 my-10 border-4 border-indigo-50 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h2 className="text-2xl font-black text-indigo-950 uppercase italic tracking-tighter">Expediente del Cliente</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-red-500 text-2xl">✖</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {/* BLOQUE TITULAR */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest border-l-4 border-indigo-500 pl-2">Información del Titular</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Nombre</label>
                  <input className="input-field" value={editData.customer.fullname} onChange={e => setEditData({...editData, customer: {...editData.customer, fullname: e.target.value}})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Apellidos</label>
                  <input className="input-field" value={editData.customer.apellidos} onChange={e => setEditData({...editData, customer: {...editData.customer, apellidos: e.target.value}})} /></div>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">DNI / NIE</label>
                <input className="input-field font-bold" value={editData.customer.dni} onChange={e => setEditData({...editData, customer: {...editData.customer, dni: e.target.value}})} /></div>
                
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest border-l-4 border-indigo-500 pl-2 mt-6">Contacto</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</label>
                  <input className="input-field" value={editData.customer.phone} onChange={e => setEditData({...editData, customer: {...editData.customer, phone: e.target.value}})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Email</label>
                  <input className="input-field" value={editData.customer.email} onChange={e => setEditData({...editData, customer: {...editData.customer, email: e.target.value}})} /></div>
                </div>
                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Dirección</label>
                <input className="input-field" value={editData.customer.address} onChange={e => setEditData({...editData, customer: {...editData.customer, address: e.target.value}})} /></div>
              </div>

              {/* BLOQUE PÓLIZA */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest border-l-4 border-orange-500 pl-2">Detalles del Seguro</h3>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Compañía</label>
                <select className="input-field font-black text-orange-600" value={editData.company} onChange={e => setEditData({...editData, company: e.target.value})}>
                  {aseguradorasEspana.map(a => <option key={a} value={a}>{a}</option>)}
                </select></div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Nº Póliza</label>
                  <input className="input-field" value={editData.policyNumber} onChange={e => setEditData({...editData, policyNumber: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Prima (€)</label>
                  <input className="input-field font-bold" value={editData.premium} onChange={e => setEditData({...editData, premium: e.target.value})} /></div>
                </div>

                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Ramo</label>
                <select className="input-field" value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})}>
                    <option value="Hogar">🏠 Hogar</option>
                    <option value="Vehículo">🚗 Vehículo</option>
                    <option value="Vida">💖 Vida</option>
                    <option value="Salud">🏥 Salud</option>
                    <option value="Comercio">🏢 Comercio</option>
                </select></div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Fecha Alta</label>
                  <input type="date" className="input-field bg-white" value={editData.issuedAt} onChange={e => setEditData({...editData, issuedAt: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-red-500 uppercase">Vencimiento</label>
                  <input type="date" className="input-field font-black text-red-600 bg-white" value={editData.expiresAt} onChange={e => setEditData({...editData, expiresAt: e.target.value})} /></div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button onClick={() => handleAction(editData.id, 'save-update', {...editData, status: 'normal'})} className="flex-1 bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-indigo-800 transition-all tracking-widest">Guardar y Finalizar Gestión</button>
              <button onClick={() => setIsModalOpen(false)} className="px-8 bg-slate-50 text-slate-400 rounded-2xl font-bold uppercase text-[10px]">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .input-field { background: white; border: 2px solid #f1f5f9; padding: 10px 14px; border-radius: 12px; outline: none; width: 100%; font-size: 13px; color: #1e293b; transition: all 0.2s; }
        .input-field:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.05); }
      `}} />
    </div>
  );
}

export default App;