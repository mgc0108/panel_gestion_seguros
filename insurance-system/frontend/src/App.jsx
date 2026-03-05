import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchGlobal, setSearchGlobal] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState({});

  const formRef = useRef(null);
  const editFormRef = useRef(null);

  const categorias = [
    { id: "HOGAR", label: "🏠 HOGAR" },
    { id: "COMUNIDADES", label: "🏢 COMUNIDADES" },
    { id: "AUTOS", label: "🚗 AUTOS" },
    { id: "SALUD", label: "🏥 SALUD" },
    { id: "VIDA", label: "🛡️ VIDA" },
    { id: "DECESOS", label: "⚰️ DECESOS" },
    { id: "EMPRESA/COMERCIO", label: "🏪 EMPRESA/COMERCIO" },
    { id: "RC", label: "⚖️ RESP. CIVIL" },
    { id: "MASCOTAS", label: "🐾 MASCOTAS" }
  ];

  const companiasEspana = ["MAPFRE", "ALLIANZ", "AXA", "MUTUA MADRILEÑA", "REALE", "GENERALI", "CASER", "FIATC", "PELAYO", "LIBERTY", "HELVETIA", "ADESLAS", "SANITAS", "ASISA", "DKV", "CATALANA OCCIDENTE", "PLUS ULTRA", "SANTALUCÍA", "OCASO", "ZURICH"];
  const meses = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  const API_URL = "https://69a1b3d42e82ee536fa2038c.mockapi.io/policies/policies";

  const fetchData = async () => {
    try {
      const res = await axios.get(API_URL);
      setPolicies(res.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const checkMenor = (fecha) => {
    if (!fecha) return "";
    const hoy = new Date();
    const cumple = new Date(fecha);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    if (hoy.getMonth() < cumple.getMonth() || (hoy.getMonth() === cumple.getMonth() && hoy.getDate() < cumple.getDate())) edad--;
    return edad < 18 ? "⚠️ MENOR DE EDAD" : "";
  };

  // --- CAMBIO SOLICITADO: ELIMINACIÓN DIRECTA A BAJAS ---
  const handleAction = async (id, action) => {
    const p = policies.find(x => x.id === id);
    try {
      if (action === 'delete') {
        // Ahora se elimina la confirmación y pasa a baja directamente
        await axios.put(`${API_URL}/${id}`, { ...p, status: 'baja' });
      } else if (action === 'permanent_delete') {
        if (!confirm("¿ELIMINAR DEFINITIVAMENTE? Esta acción no se puede deshacer.")) return;
        await axios.delete(`${API_URL}/${id}`);
      } else if (action === 'renew') {
        const fechaOriginal = new Date(p.expiresAt);
        fechaOriginal.setFullYear(fechaOriginal.getFullYear() + 1);
        const nuevaFechaStr = fechaOriginal.toISOString().split('T')[0];
        await axios.put(`${API_URL}/${id}`, { ...p, status: 'normal', expiresAt: nuevaFechaStr });
      } else if (action === 'mejorar') {
        await axios.put(`${API_URL}/${id}`, { ...p, status: 'recalculando' });
      } else if (action === 'aceptar_oferta') {
        const updated = { ...p, status: 'normal' };
        await axios.put(`${API_URL}/${id}`, updated);
        setEditData(updated);
        setIsModalOpen(true);
      }
      fetchData();
    } catch (e) { alert("Error en la operación"); }
  };

  const handleFormSubmit = async (e, isEdit = false) => {
    e.preventDefault();
    const fd = new FormData(isEdit ? editFormRef.current : formRef.current);
    const data = Object.fromEntries(fd.entries());
    try {
      if (isEdit) {
        await axios.put(`${API_URL}/${editData.id}`, { ...data, status: 'normal' });
        setIsModalOpen(false);
      } else {
        await axios.post(API_URL, { ...data, status: 'normal' });
        setShowForm(false);
        setSelectedCategory('');
      }
      fetchData();
    } catch (e) { alert("Error al guardar"); }
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const q = searchGlobal.toLowerCase();
      return (p.clientName?.toLowerCase().includes(q) || p.apellidos?.toLowerCase().includes(q) || p.dni?.toLowerCase().includes(q) || p.phone?.includes(q));
    });
  }, [policies, searchGlobal]);

  if (loading) return <div className="p-20 text-center font-black text-indigo-600 animate-pulse text-2xl uppercase italic">InsuranceSync...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      
      <header className="fixed-header shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 w-10 h-10 rounded-xl flex items-center justify-center font-black italic shadow-lg text-white">IS</div>
          <h1 className="text-xl font-black uppercase tracking-tighter text-white">Insurance<span className="text-orange-500">Sync</span></h1>
        </div>
        <nav className="flex gap-2">
          {['dashboard', 'espera', 'archivo', 'bajas'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-300 hover:bg-white/5'}`}>
              {tab === 'dashboard' ? '📅 Vencimientos' : tab === 'espera' ? '⏳ Pendientes' : tab}
            </button>
          ))}
        </nav>
        <button onClick={() => setShowForm(!showForm)} className="bg-orange-600 px-5 py-2 rounded-xl font-black text-[10px] uppercase shadow-xl hover:scale-105 active:scale-95 transition-all text-white">{showForm ? '✖ CERRAR' : '＋ NUEVA ALTA'}</button>
      </header>

      <main className="main-scroll-container">
        <div className="max-w-7xl mx-auto p-6 pb-20">
          
          <div className="mb-8">
            <input type="text" placeholder="🔍 Buscar por Nombre, DNI o Teléfono..." className="w-full p-4 rounded-2xl border-2 border-slate-200 shadow-sm font-bold text-sm outline-none focus:border-indigo-500 bg-white" onChange={(e) => setSearchGlobal(e.target.value)} />
          </div>

          {showForm && (
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl border-2 border-indigo-100 mb-10">
               <h2 className="text-xl font-black mb-6 text-indigo-950 uppercase italic border-b-4 border-orange-500 inline-block">Nueva Alta de Póliza</h2>
               <form ref={formRef} onSubmit={(e) => handleFormSubmit(e)} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Nombre</label><input name="clientName" className="input-field" required /></div>
                  <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Apellidos</label><input name="apellidos" className="input-field" required /></div>
                  <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">DNI</label><input name="dni" className="input-field" required /></div>
                  <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Teléfono</label><input name="phone" className="input-field" /></div>
                  <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Email</label><input name="email" className="input-field" /></div>
                  <div className="md:col-span-2 space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Dirección</label><input name="address" className="input-field" /></div>
                  <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Nº Póliza</label><input name="policyNumber" className="input-field" required /></div>
                  
                  <select name="category" className="input-field font-bold mt-4" onChange={(e) => setSelectedCategory(e.target.value)} required>
                    <option value="">Tipo de Seguro...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>

                  <select name="company" className="input-field font-bold mt-4" required>
                    <option value="">Compañía...</option>
                    {companiasEspana.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  
                  <div className="flex flex-col"><label className="text-[8px] font-black ml-2 text-indigo-500 uppercase">Fecha Alta</label><input name="issuedAt" type="date" className="input-field" required /></div>
                  <div className="flex flex-col"><label className="text-[8px] font-black ml-2 text-rose-500 uppercase">Vencimiento</label><input name="expiresAt" type="date" className="input-field" required /></div>

                  {selectedCategory === "AUTOS" && (
                    <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-orange-50/50 p-6 rounded-[2.5rem] border-2 border-orange-200 mt-4">
                      {['PROPIETARIO', 'TOMADOR', 'CONDUCTOR'].map(role => (
                        <div key={role} className="bg-white p-5 rounded-3xl shadow-sm space-y-3 border border-orange-100">
                          <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest border-b border-orange-100 pb-1">{role}</p>
                          <div className="space-y-1"><label className="text-[7px] font-bold ml-1 text-slate-400 uppercase">Nombre Completo</label><input name={`${role}_nombre`} className="input-field text-xs" /></div>
                          <div className="space-y-1"><label className="text-[7px] font-bold ml-1 text-slate-400 uppercase">DNI</label><input name={`${role}_dni`} className="input-field text-xs" /></div>
                          <div className="space-y-1"><label className="text-[7px] font-bold ml-1 text-slate-400 uppercase">F. Nacimiento</label><input name={`${role}_fnac`} type="date" className="input-field text-xs" /></div>
                          <div className="space-y-1"><label className="text-[7px] font-bold ml-1 text-slate-400 uppercase">Nº Carnet</label><input name={`${role}_carnet`} className="input-field text-xs" /></div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="submit" className="md:col-span-4 bg-indigo-700 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-indigo-800 transition-all mt-4 text-sm">💾 Registrar Póliza</button>
               </form>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-12">
              {meses.map((nombreMes, index) => {
                const hoy = new Date();
                const polizasMes = filteredPolicies.filter(p => {
                    const d = new Date(p.expiresAt);
                    return p.status === 'normal' && d.getMonth() === index && d.getFullYear() === hoy.getFullYear();
                });
                
                if (polizasMes.length === 0) return null;
                return (
                  <div key={nombreMes}>
                    <h2 className="text-xl font-black text-slate-800 uppercase italic flex items-center gap-3 mb-6"><span className="w-2 h-7 bg-orange-500 rounded-full"></span> {nombreMes} {hoy.getFullYear()}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {polizasMes.map(p => (
                        <div key={p.id} className="bg-white rounded-[2.5rem] shadow-lg border border-slate-100 overflow-hidden hover:shadow-2xl transition-all">
                          <div className="bg-indigo-50 p-6 flex justify-between items-start">
                            <div><p className="text-[9px] font-black text-indigo-400 uppercase">{p.company}</p><h3 className="font-black text-xl text-indigo-950 uppercase leading-tight">{p.clientName} {p.apellidos}</h3></div>
                            <span className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-indigo-600 shadow-sm">{p.policyNumber}</span>
                          </div>
                          <div className="p-6 space-y-4">
                            <div className="bg-rose-50 p-4 rounded-2xl text-center border border-rose-100"><p className="text-[8px] font-black text-rose-400 uppercase">Vence</p><p className="text-lg font-black text-rose-600">{p.expiresAt}</p></div>
                            <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => handleAction(p.id, 'renew')} className="bg-emerald-500 text-white py-3 rounded-xl text-[9px] font-black uppercase hover:scale-105 transition-transform">Renovar Año</button>
                              <button onClick={() => handleAction(p.id, 'mejorar')} className="bg-orange-500 text-white py-3 rounded-xl text-[9px] font-black uppercase">Mejorar</button>
                              <button onClick={() => handleAction(p.id, 'delete')} className="bg-rose-100 text-rose-600 py-3 rounded-xl text-[9px] font-black uppercase">Mover Baja</button>
                              <button onClick={() => { setEditData(p); setIsModalOpen(true); }} className="bg-slate-100 text-slate-600 py-3 rounded-xl text-[9px] font-black uppercase">🔍 Ficha</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'espera' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filteredPolicies.filter(p => p.status === 'recalculando').map(p => (
                <div key={p.id} className="bg-slate-900 rounded-[2.5rem] p-6 border-t-8 border-orange-500 shadow-2xl">
                  <p className="text-[10px] font-black text-orange-400 uppercase italic">En negociación</p>
                  <h3 className="text-white text-xl font-black uppercase mb-4">{p.clientName} {p.apellidos}</h3>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => handleAction(p.id, 'aceptar_oferta')} className="bg-emerald-600 text-white py-3 rounded-xl font-black text-[10px] uppercase">✅ Oferta Aceptada</button>
                    <button onClick={() => { setEditData(p); setIsModalOpen(true); }} className="bg-slate-700 text-white py-3 rounded-xl font-black text-[10px] uppercase">Ver Ficha</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'archivo' && (
            <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-[10px] font-black uppercase text-slate-400">
                    <th className="pb-4">Cliente</th><th className="pb-4">Ramo</th><th className="pb-4">Compañía</th><th className="pb-4">Vencimiento</th><th className="pb-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold text-slate-700">
                  {filteredPolicies.filter(p => p.status === 'normal').map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-4 uppercase">{p.clientName} {p.apellidos}</td>
                      <td className="py-4 font-black text-indigo-600">{p.category}</td>
                      <td className="py-4">{p.company}</td>
                      <td className="py-4 text-rose-500">{p.expiresAt}</td>
                      <td className="py-4 text-right flex justify-end gap-2">
                        <button onClick={() => { setEditData(p); setIsModalOpen(true); }} className="bg-indigo-100 text-indigo-600 px-4 py-1 rounded-lg text-[10px] uppercase font-black">Ficha</button>
                        <button onClick={() => handleAction(p.id, 'delete')} className="bg-rose-100 text-rose-600 px-4 py-1 rounded-lg text-[10px] uppercase font-black hover:bg-rose-600 hover:text-white transition-all">🗑️ Baja</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'bajas' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPolicies.filter(p => p.status === 'baja').map(p => (
                <div key={p.id} className="bg-white p-6 rounded-[2rem] border-2 border-rose-100 shadow-sm space-y-4">
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="font-black uppercase text-rose-950 text-sm">{p.clientName} {p.apellidos}</h3>
                       <p className="text-[9px] font-black text-rose-400 uppercase italic">Ex-cliente / {p.company}</p>
                     </div>
                     <span className="text-[14px]">🥀</span>
                   </div>
                   <div className="flex gap-2 pt-2 border-t border-rose-50">
                     <button onClick={() => { setEditData(p); setIsModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-2 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-700 transition-all">🔍 Ver Ficha</button>
                     <button onClick={() => handleAction(p.id, 'permanent_delete')} className="flex-1 bg-rose-500 text-white py-2 rounded-xl text-[9px] font-black uppercase hover:bg-black transition-all">🗑️ Eliminar</button>
                   </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-6xl w-full p-10 relative max-h-[90vh] overflow-y-auto border-4 border-indigo-950">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 hover:bg-rose-500 hover:text-white transition-all">✖</button>
            <h2 className="text-2xl font-black text-indigo-950 uppercase mb-8 italic border-l-8 border-orange-500 pl-4">Ficha Técnica Integral</h2>
            <form ref={editFormRef} onSubmit={(e) => handleFormSubmit(e, true)} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-3xl">
                <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Nombre</label><input name="clientName" defaultValue={editData.clientName} className="input-field" /></div>
                <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Apellidos</label><input name="apellidos" defaultValue={editData.apellidos} className="input-field" /></div>
                <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">DNI</label><input name="dni" defaultValue={editData.dni} className="input-field" /></div>
                <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Teléfono</label><input name="phone" defaultValue={editData.phone} className="input-field" /></div>
                <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Email</label><input name="email" defaultValue={editData.email} className="input-field" /></div>
                <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Póliza</label><input name="policyNumber" defaultValue={editData.policyNumber} className="input-field" /></div>
                <div className="col-span-2"><label className="text-[8px] font-black ml-2 uppercase text-slate-400">Dirección</label><input name="address" defaultValue={editData.address} className="input-field" /></div>
                <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-indigo-500">Fecha Alta</label><input name="issuedAt" type="date" defaultValue={editData.issuedAt} className="input-field" /></div>
                <div className="space-y-1"><label className="text-[8px] font-black ml-2 uppercase text-rose-500">Vencimiento</label><input name="expiresAt" type="date" defaultValue={editData.expiresAt} className="input-field" /></div>
              </div>

              <div className="flex flex-col bg-slate-900 p-6 rounded-3xl">
                <h3 className="text-[10px] font-black text-orange-400 uppercase mb-3 italic">📝 Notas</h3>
                <textarea name="notes" defaultValue={editData.notes} className="flex-1 w-full p-6 rounded-2xl bg-slate-800 text-white font-bold text-sm min-h-[250px] outline-none border-2 border-slate-700"></textarea>
              </div>
              
              {editData.category === "AUTOS" && (
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 bg-orange-50 p-6 rounded-3xl border border-orange-200">
                  {['PROPIETARIO', 'TOMADOR', 'CONDUCTOR'].map(role => (
                    <div key={role} className="bg-white p-4 rounded-2xl border border-orange-100 space-y-2">
                      <p className="text-[9px] font-black text-orange-600 uppercase mb-2 border-b border-orange-50 pb-1">{role}</p>
                      <div className="space-y-1"><label className="text-[7px] font-bold ml-1 text-slate-400 uppercase">Nombre</label><input name={`${role}_nombre`} defaultValue={editData[`${role}_nombre`]} className="input-field text-xs" /></div>
                      <div className="space-y-1"><label className="text-[7px] font-bold ml-1 text-slate-400 uppercase">DNI</label><input name={`${role}_dni`} defaultValue={editData[`${role}_dni`]} className="input-field text-xs" /></div>
                      <div className="space-y-1"><label className="text-[7px] font-bold ml-1 text-slate-400 uppercase">F. Nacimiento</label><input name={`${role}_fnac`} type="date" defaultValue={editData[`${role}_fnac`]} className="input-field text-xs" /></div>
                      <div className="space-y-1"><label className="text-[7px] font-bold ml-1 text-slate-400 uppercase">Nº Carnet</label><input name={`${role}_carnet`} defaultValue={editData[`${role}_carnet`]} className="input-field text-xs" /></div>
                    </div>
                  ))}
                </div>
              )}
              <button type="submit" className="md:col-span-3 bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase shadow-2xl hover:bg-black transition-all">💾 Guardar y Activar Póliza</button>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        html, body, #root { height: 100vh; overflow: hidden; margin: 0; background: #f8fafc; font-family: 'Inter', sans-serif; }
        .fixed-header { height: 80px; background: #1e1b4b; display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; }
        .main-scroll-container { height: calc(100vh - 80px); overflow-y: auto; }
        .input-field { background: white !important; border: 2px solid #e2e8f0 !important; padding: 10px 12px !important; border-radius: 10px !important; font-weight: 700 !important; width: 100%; color: #1e293b !important; font-size: 13px !important; outline: none; }
        .modal-overlay { position: fixed; inset: 0; z-index: 9999; display: flex; align-items: center; justify-content: center; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); }
        button { cursor: pointer; transition: all 0.2s ease; }
      `}} />
    </div>
  );
}

export default App;