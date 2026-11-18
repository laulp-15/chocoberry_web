// src/features/profile/components/PersonalInfo.jsx
import { useState, useEffect } from 'react';
import useAuthTheme from '../../login/hooks/useAuthTheme';
import { useAuth } from '../../login/hooks/useAuth';
import {
  validateApellidos,
  validateAddress,
  validateDocType,
  validateEmail,
  validateIdNumber,
  validateNombres,
  validatePhone,
} from '../../login/utils/validators';
import FormTextField from '../../../shared/components/FormTextField';
import FormSelect from '../../../shared/components/FormSelect';
import { DOC_TYPE_OPTIONS } from '../../../shared/utils/documentTypes';

const FALLBACK_PROFILE_DATA = {
  idNumber: '1234567890',
  phone: '300 123 4567',
  address: 'Calle 123 #45-67',
};

const API_FIELD_TO_FORM = {
  nombres: 'firstName',
  apellidos: 'lastName',
  tipoDocumento: 'docType',
  numeroDocumento: 'idNumber',
  correo: 'email',
  telefono: 'phone',
  direccion: 'address',
};

const PROFILE_SECTION_FIELDS = {
  personal: ['docType', 'idNumber', 'firstName', 'lastName', 'address'],
  contact: ['email', 'phone'],
};

const PROFILE_FIELD_VALIDATORS = {
  docType: validateDocType,
  idNumber: validateIdNumber,
  firstName: validateNombres,
  lastName: validateApellidos,
  address: validateAddress,
  email: validateEmail,
  phone: validatePhone,
};

function validateProfileField(field, value) {
  if (field === 'phone' && !String(value ?? '').trim()) {
    return 'El teléfono es obligatorio.';
  }
  return PROFILE_FIELD_VALIDATORS[field]?.(value) || '';
}

const PersonalInfo = () => {
  const { theme } = useAuthTheme();
  const { user, updateUser } = useAuth();
  const isDark = theme === 'dark';

  const [editingSection, setEditingSection] = useState(null);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState(null);

  const [userInfo, setUserInfo] = useState({
    id: '',
    docType: 'CC',
    idNumber: '',
    firstName: '',
    lastName: '',
    address: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user && editingSection === null) {
      const fullName = user.fullName || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setUserInfo({
        id: user.id,
        docType: user.docType || 'CC',
        idNumber: user.idNumber || FALLBACK_PROFILE_DATA.idNumber,
        firstName,
        lastName,
        address: user.address || FALLBACK_PROFILE_DATA.address,
        email: user.email || '',
        phone: user.phone || FALLBACK_PROFILE_DATA.phone,
      });
    }
  }, [user, editingSection]);

  const colors = {
    primary: '#d90429',
    primaryHover: '#e63946',
    text: isDark ? '#f7f1f2' : '#4a4a4a',
    textMuted: isDark ? '#b8a3a7' : '#6c757d',
    cardBg: isDark ? '#23161a' : '#fff5f6',
    borderSubtle: isDark ? '#3d2c30' : '#fde2e4',
    inputBg: isDark ? '#181013' : '#ffffff',
    inputText: isDark ? '#f7f1f2' : '#2d1e21',
    inputBorder: isDark ? '#3d2c30' : '#fde2e4',
    inputFocusBorder: '#d90429',
    inputFocusShadow: 'rgba(217, 4, 41, 0.25)',
    tipBg: isDark ? '#23161a' : '#fff5f6',
    tipBorder: isDark ? '#5c3a3e' : '#f6bd60',
    tipText: isDark ? '#f7f1f2' : '#b5838d',
    error: '#e63946',
    success: '#2a9d8f',
  };

  const handleChange = (name, value) => {
    setUserInfo((prev) => ({ ...prev, [name]: value }));
    setProfileErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
    setProfileMessage(null);
  };

  const validateProfileForm = (section = editingSection) => {
    const errors = {};
    (PROFILE_SECTION_FIELDS[section] || []).forEach((field) => {
      const message = validateProfileField(field, userInfo[field]);
      if (message) errors[field] = message;
    });
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const mapProfileServerErrors = (serverErrors) => {
    const errors = {};
    const general = [];

    if (!Array.isArray(serverErrors)) return { errors, general };

    serverErrors.forEach((issue) => {
      const field = API_FIELD_TO_FORM[issue?.campo];
      const message = issue?.mensaje;
      if (!message) return;

      if (field) {
        if (!errors[field]) errors[field] = message;
      } else {
        general.push(message);
      }
    });

    return { errors, general };
  };

  const handleSubmit = async () => {
    if (!editingSection || !validateProfileForm(editingSection)) return;
    setProfileMessage(null);

    try {
      const payload =
        editingSection === 'personal'
          ? {
              docType: userInfo.docType,
              idNumber: userInfo.idNumber,
              firstName: userInfo.firstName,
              lastName: userInfo.lastName,
              address: userInfo.address,
              fullName: `${userInfo.firstName} ${userInfo.lastName}`.trim(),
            }
          : {
              email: userInfo.email,
              phone: userInfo.phone,
            };

      await updateUser(payload);
      setEditingSection(null);
    } catch (error) {
      if (error.code === 'EMAIL_TAKEN' || error.code === 'CONFLICT') {
        setProfileErrors((current) => ({
          ...current,
          email: error.message || 'Este correo electrónico ya está registrado.',
        }));
        return;
      }

      if (error.code === 'DOCUMENT_TAKEN') {
        setProfileErrors((current) => ({
          ...current,
          idNumber:
            error.message || 'Este número de documento ya está registrado.',
        }));
        return;
      }

      const { errors: serverFieldErrors, general } = mapProfileServerErrors(
        error.errors
      );

      if (Object.keys(serverFieldErrors).length) {
        setProfileErrors((current) => ({
          ...current,
          ...serverFieldErrors,
        }));
      }

      if (general.length) {
        setProfileMessage({ type: 'error', text: general.join(' ') });
        return;
      }

      if (Object.keys(serverFieldErrors).length) return;

      setProfileMessage({
        type: 'error',
        text: error.message || 'No se pudieron guardar los cambios.',
      });
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editingSection) handleSubmit();
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setProfileErrors({});
    setProfileMessage(null);
    if (user) {
      const fullName = user.fullName || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      setUserInfo({
        id: user.id,
        docType: user.docType || 'CC',
        idNumber: user.idNumber || FALLBACK_PROFILE_DATA.idNumber,
        firstName,
        lastName,
        address: user.address || FALLBACK_PROFILE_DATA.address,
        email: user.email || '',
        phone: user.phone || FALLBACK_PROFILE_DATA.phone,
      });
    }
  };

  const startEdit = (section) => {
    setProfileErrors({});
    setProfileMessage(null);
    setEditingSection(section);
  };

  const renderSection = (
    title,
    icon,
    children,
    isEditing,
    onEdit,
    onCancel,
    onSave,
    editLabel = 'Editar',
    feedback = null
  ) => (
    <div style={{
      border: `1px solid ${colors.borderSubtle}`,
      borderRadius: '12px',
      background: colors.cardBg,
      overflow: 'hidden',
      marginBottom: '20px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        background: isDark ? '#1a1215' : '#fafafa',
        borderBottom: `1px solid ${colors.borderSubtle}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className={`fa-solid ${icon}`} style={{ fontSize: '20px' }} aria-hidden="true" />
          <h3 style={{ margin: 0, color: colors.primary, fontSize: '18px', fontWeight: '700' }}>
            {title}
          </h3>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={() => onEdit()}
            style={{
              padding: '6px 12px',
              background: colors.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = colors.primaryHover}
            onMouseLeave={(e) => e.currentTarget.style.background = colors.primary}
          >
            {editLabel}
          </button>
        )}
      </div>
      <div style={{ padding: '20px' }}>
        {children}
        {isEditing && feedback && (
          <div
            role="alert"
            style={{
              marginTop: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: isDark ? '#3a1a1a' : '#ffe8e8',
              border: `1px solid ${colors.error}`,
              color: colors.error,
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            {feedback.text}
          </div>
        )}
        {isEditing && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '20px', borderTop: `1px solid ${colors.borderSubtle}` }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: colors.textMuted,
                border: `1px solid ${colors.borderSubtle}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background 0.2s, color 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.cardBg;
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.color = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = colors.borderSubtle;
                e.currentTarget.style.color = colors.textMuted;
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave()}
              style={{
                padding: '8px 16px',
                background: colors.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                boxShadow: `0 4px 15px ${colors.inputFocusShadow}`,
                transition: 'background 0.2s, transform 0.1s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.primaryHover}
              onMouseLeave={(e) => e.currentTarget.style.background = colors.primary}
            >
              Guardar
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <form id="personal-info-form" onSubmit={handleFormSubmit}>
      <div>
        <h2 style={{
          fontSize: '24px',
          color: colors.primary,
          marginBottom: '20px',
          borderBottom: `2px solid ${colors.borderSubtle}`,
          paddingBottom: '10px',
          fontWeight: '700'
        }}>
          Mis datos
        </h2>

        {/* Sección 1: Información personal */}
        {renderSection(
          'Información personal',
          'fa-id-card',
          (
            <>
              {!editingSection ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: colors.text, fontSize: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div>
                      <strong style={{ color: colors.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Tipo de documento</strong>
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>
                        {DOC_TYPE_OPTIONS.find(d => d.value === userInfo.docType)?.label || userInfo.docType}
                      </p>
                    </div>
                    <div>
                      <strong style={{ color: colors.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Número de documento</strong>
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{userInfo.idNumber || FALLBACK_PROFILE_DATA.idNumber}</p>
                    </div>
                    <div>
                      <strong style={{ color: colors.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Nombre</strong>
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{userInfo.firstName || '—'}</p>
                    </div>
                    <div>
                      <strong style={{ color: colors.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Apellido</strong>
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{userInfo.lastName || '—'}</p>
                    </div>
                    <div>
                      <strong style={{ color: colors.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Dirección</strong>
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{userInfo.address || FALLBACK_PROFILE_DATA.address}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <FormSelect
                      label="Tipo de documento"
                      name="docType"
                      value={userInfo.docType}
                      onChange={(value) => handleChange('docType', value)}
                      options={DOC_TYPE_OPTIONS}
                      error={profileErrors.docType}
                      required
                    />
                    <FormTextField
                      label="Número de documento"
                      type="text"
                      name="idNumber"
                      value={userInfo.idNumber}
                      onChange={(value) => handleChange('idNumber', value)}
                      placeholder="Ej: 1234567890"
                      error={profileErrors.idNumber}
                      required
                    />
                    <FormTextField
                      label="Nombre"
                      type="text"
                      name="firstName"
                      value={userInfo.firstName}
                      onChange={(value) => handleChange('firstName', value)}
                      error={profileErrors.firstName}
                      required
                    />
                    <FormTextField
                      label="Apellido"
                      type="text"
                      name="lastName"
                      value={userInfo.lastName}
                      onChange={(value) => handleChange('lastName', value)}
                      error={profileErrors.lastName}
                      required
                    />
                    <FormTextField
                      label="Dirección"
                      type="text"
                      name="address"
                      value={userInfo.address}
                      onChange={(value) => handleChange('address', value)}
                      error={profileErrors.address}
                      required
                    />
                  </div>
                </div>
              )}
            </>
          ),
          editingSection === 'personal',
          () => startEdit('personal'),
          cancelEdit,
          handleSubmit,
          'Editar',
          profileMessage
        )}

        {/* Sección 3: Información de contacto */}
        {renderSection(
          'Información de contacto',
          'fa-phone',
          (
            <>
              {!editingSection ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: colors.text, fontSize: '15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div>
                      <strong style={{ color: colors.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Correo electrónico</strong>
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{userInfo.email || '—'}</p>
                    </div>
                    <div>
                      <strong style={{ color: colors.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Teléfono</strong>
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{userInfo.phone || FALLBACK_PROFILE_DATA.phone}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <FormTextField
                      label="Correo electrónico"
                      type="email"
                      name="email"
                      value={userInfo.email}
                      onChange={(value) => handleChange('email', value)}
                      error={profileErrors.email}
                      required
                    />
                    <FormTextField
                      label="Teléfono"
                      type="text"
                      name="phone"
                      value={userInfo.phone}
                      onChange={(value) => handleChange('phone', value)}
                      error={profileErrors.phone}
                      required
                    />
                  </div>
                </div>
              )}
            </>
          ),
          editingSection === 'contact',
          () => startEdit('contact'),
          cancelEdit,
          handleSubmit,
          'Editar',
          profileMessage
        )}

        {/* Consejo */}
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: colors.tipBg, borderRadius: '12px', border: `1px dashed ${colors.tipBorder}`, transition: 'background 0.3s ease, border-color 0.3s ease' }}>
          <p style={{ margin: 0, color: colors.tipText, fontSize: '15px', fontWeight: '500' }}> Consejo: Recuerda mantener tu número de teléfono y correo actualizados para que tus sorpresas lleguen siempre a tiempo.</p>
        </div>
      </div>
    </form>
  );
};

export default PersonalInfo;