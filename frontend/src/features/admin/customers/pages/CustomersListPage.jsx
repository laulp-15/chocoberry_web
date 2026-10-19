import React from 'react';
import { useCustomers } from '../hooks/useCustomers';
import CustomerFormModal from '../components/CustomerFormModal';

export default function CustomersListPage() {
  const {
    searchTerm,
    handleSearchChange,
    statusFilter,
    handleStatusFilterChange,
    currentPage,
    totalPages,
    handlePageChange,
    isModalOpen,
    setIsModalOpen,
    isDetailOpen,
    setIsDetailOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    selectedCustomer,
    customerToEdit,
    currentCustomers,
    totalCustomersCount,
    handleToggleStatus,
    handleSaveCustomer,
    handleConfirmDelete,
    handleOpenCreate,
    handleOpenEdit,
    handleOpenDetail,
    handleOpenDelete
  } = useCustomers();

  return (
    <div style={{ padding: '2rem', backgroundColor: '#FAFAFA', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#471C26', margin: 0 }}>Clientes</h1>
      <p style={{ color: '#6B5A54', marginTop: '0.4rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Consulta y administra la información de los clientes registrados.
      </p>

      {/* FILTROS Y BÚSQUEDA */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={handleOpenCreate}
          style={{
            backgroundColor: '#E63950',
            color: '#ffffff',
            border: 'none',
            padding: '0.65rem 1.2rem',
            borderRadius: '25px',
            fontWeight: '600',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(230, 57, 80, 0.2)',
          }}
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Crear cliente
        </button>

        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <input
            type="text"
            placeholder="Buscar por nombre, correo, teléfono o dirección..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: '25px',
              border: '1px solid #EADBDA',
              backgroundColor: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#A0958F', fontSize: '0.9rem' }}
            aria-hidden="true"
          />
        </div>

        <button
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #EADBDA',
            padding: '0.65rem 1.2rem',
            borderRadius: '25px',
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#471C26',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <i className="fa-solid fa-filter" style={{ color: '#E63950' }} aria-hidden="true" />
          Filtros
        </button>

        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #EADBDA',
            padding: '0.65rem 1.2rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
            color: '#6B5A54',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {/* TABLA DE CLIENTES */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#FCE8EC', color: '#471C26', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <th style={{ padding: '1rem 1.5rem' }}>Nombre</th>
              <th style={{ padding: '1rem 1.5rem' }}>Teléfono</th>
              <th style={{ padding: '1rem 1.5rem' }}>Dirección</th>
              <th style={{ padding: '1rem 1.5rem' }}>Correo</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Estado</th>
              <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentCustomers.length > 0 ? (
              currentCustomers.map((cliente, index) => (
                <tr
                  key={cliente.id}
                  style={{
                    borderBottom: index !== currentCustomers.length - 1 ? '1px solid #F5EFEA' : 'none',
                    fontSize: '0.9rem',
                    color: '#471C26',
                  }}
                >
                  <td style={{ padding: '1rem 1.5rem', fontWeight: '600' }}>
                    {cliente.nombre}
                  </td>

                  <td style={{ padding: '1rem 1.5rem', color: '#6B5A54' }}>
                    {cliente.telefono}
                  </td>

                  <td style={{ padding: '1rem 1.5rem', color: '#6B5A54', maxWidth: '250px' }}>
                    {cliente.direccion}
                  </td>

                  <td style={{ padding: '1rem 1.5rem', color: '#6B5A54' }}>
                    {cliente.correo}
                  </td>

                  {/* ESTADO (SWITCH TOGGLE) */}
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleToggleStatus(cliente.id)}
                      style={{
                        width: '46px',
                        height: '24px',
                        borderRadius: '12px',
                        backgroundColor: cliente.estado === 'Activo' ? '#2E7D32' : '#E8D7DC',
                        border: 'none',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background-color 0.2s ease',
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px'
                      }}
                      title={`Estado: ${cliente.estado}. Clic para cambiar.`}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#ffffff',
                          position: 'absolute',
                          left: cliente.estado === 'Activo' ? '24px' : '2px',
                          transition: 'left 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }}
                      />
                    </button>
                  </td>

                  {/* ACCIONES */}
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      
                      {/* Ver Detalle */}
                      <button 
                        onClick={() => handleOpenDetail(cliente)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B5A54', padding: 0 }} 
                        title="Ver detalle"
                      >
                        <svg width="18" height="18" viewBox="0 0 576 512" fill="currentColor">
                          <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.4 78.1-95.4 92.9-131.1c3.3-7.9 3.3-16.7 0-24.6C558.7 204 527.4 152 480.6 108.6C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64a64 64 0 1 0 0 128 64 64 0 1 0 0-128z"/>
                        </svg>
                      </button>

                      {/* Editar */}
                      <button 
                        onClick={() => handleOpenEdit(cliente)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B5A54', padding: 0 }} 
                        title="Editar"
                      >
                        <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
                          <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.3-2.8 15.8-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/>
                        </svg>
                      </button>

                      {/* Eliminar */}
                      <button 
                        onClick={() => handleOpenDelete(cliente)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B5A54', padding: 0 }} 
                        title="Eliminar"
                      >
                        <svg width="16" height="16" viewBox="0 0 448 512" fill="currentColor">
                          <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/>
                        </svg>
                      </button>

                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#6B5A54' }}>
                  No se encontraron clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PAGINACIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', backgroundColor: '#FAFAFA', borderTop: '1px solid #F5EFEA' }}>
          <span style={{ fontSize: '0.85rem', color: '#6B5A54' }}>
            Mostrando {currentCustomers.length} de {totalCustomersCount} clientes
          </span>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                background: 'none',
                border: 'none',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                color: currentPage === 1 ? '#C5BDBA' : '#471C26',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Anterior
            </button>

            <span style={{ fontSize: '0.85rem', color: '#471C26', fontWeight: 'bold', padding: '0 0.5rem' }}>
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                background: 'none',
                border: 'none',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                color: currentPage === totalPages ? '#C5BDBA' : '#471C26',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              Siguiente <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </button>
          </div>
        </div>

      </div>

      {/* MODAL CREAR / EDITAR */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCustomer}
        initialData={customerToEdit}
      />

      {/* MODAL VER DETALLE */}
      <CustomerFormModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        initialData={selectedCustomer}
        isReadOnly={true}
      />

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {isDeleteOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '1.8rem', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#FDF2F4', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ color: '#E63950', fontSize: '1.25rem' }} aria-hidden="true" />
            </div>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#471C26' }}>¿Eliminar cliente?</h3>
            <p style={{ color: '#6B5A54', fontSize: '0.9rem', margin: '0 0 1.5rem 0' }}>
              ¿Estás seguro de que deseas eliminar al cliente <strong>"{selectedCustomer?.nombre}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center' }}>
              <button onClick={() => setIsDeleteOpen(false)} style={{ backgroundColor: '#F5EFEA', color: '#471C26', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '20px', fontWeight: '600', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleConfirmDelete} style={{ backgroundColor: '#E63950', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '20px', fontWeight: '600', cursor: 'pointer' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}