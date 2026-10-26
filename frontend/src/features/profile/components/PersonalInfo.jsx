// src/features/profile/components/PersonalInfo.jsx
import React, { useState, useEffect } from 'react';
import useAuthTheme from '../../login/hooks/useAuthTheme';
import { useAuth } from '../../login/hooks/useAuth';
import { getPasswordChecks, validateConfirmPassword, validateEmail, validatePhone } from '../../login/utils/validators';
import FormTextField from '../../../shared/components/FormTextField';
import FormSelect from '../../../shared/components/FormSelect';
import { DOC_TYPE_OPTIONS } from '../../../shared/utils/documentTypes';

const PersonalInfo = () => {
  const { theme } = useAuthTheme();
  const { user, changePassword, updateUser } = useAuth();
  const isDark = theme === 'dark';

  const [editingSection, setEditingSection] = useState(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [profileErrors, setProfileErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  const [userInfo, setUserInfo] = useState({
    id: '',
    docType: 'CC',
    idNumber: '',
    firstName: '',
    lastName: '',
    address: '',
    neighborhood: '',
    email: '',
    phone: '',
  });

  const fakeData = {
    idNumber: '1234567890',
    phone: '300 123 4567',
    address: 'Calle 123 #45-67',
    neighborhood: 'Barrio Centro',
  };

  useEffect(() => {
    if (user && editingSection === null) {
      const fullName = user.fullName || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setUserInfo({
        id: user.id,
        docType: user.docType || 'CC',
        idNumber: user.idNumber || fakeData.idNumber,
        firstName,
        lastName,
        address: user.address || fakeData.address,
        neighborhood: user.neighborhood || fakeData.neighborhood,
        email: user.email || '',
        phone: user.phone || fakeData.phone,
      });
    }
  }, [user.id, editingSection]);

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
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (name, value) => {
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (name === 'newPassword') {
      const checks = getPasswordChecks(value);
      setPasswordErrors((prev) => ({
        ...prev,
        newPassword:
          !checks.minLength || !checks.hasUpper || !checks.hasNumber || !checks.hasSpecial
            ? 'La contraseña no cumple con los requisitos mínimos.'
            : '',
      }));
    }
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'La contraseña actual es obligatoria';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'La contraseña es obligatoria.';
    } else {
      const checks = getPasswordChecks(passwordForm.newPassword);
      if (!checks.minLength || !checks.hasUpper || !checks.hasNumber || !checks.hasSpecial) {
        errors.newPassword = 'La contraseña no cumple con los requisitos mínimos.';
      }
    }
    const confirmError = validateConfirmPassword(
      passwordForm.newPassword,
      passwordForm.confirmPassword
    );
    if (confirmError) {
      errors.confirmPassword = confirmError;
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!userInfo.docType) errors.docType = 'Seleccione el tipo de documento';
    if (!userInfo.idNumber) errors.idNumber = 'El número de documento es obligatorio';
    if (!userInfo.firstName) errors.firstName = 'El nombre es obligatorio';
    if (!userInfo.lastName) errors.lastName = 'El apellido es obligatorio';
    if (!userInfo.address) errors.address = 'La dirección es obligatoria';
    if (!userInfo.neighborhood) errors.neighborhood = 'El barrio es obligatorio';
    if (!userInfo.email) {
      errors.email = 'El correo electrónico es obligatorio';
    } else {
      // validateEmail devuelve "" cuando el correo es válido y un mensaje cuando no lo es.
      const emailError = validateEmail(userInfo.email);
      if (emailError) errors.email = emailError;
    }
    if (!userInfo.phone) errors.phone = 'El teléfono es obligatorio';
    else {
      // validatePhone devuelve "" cuando el teléfono es válido (solo números,
      // se toleran espacios y guiones) y exactamente 10 dígitos.
      const phoneError = validatePhone(userInfo.phone);
      if (phoneError) errors.phone = phoneError;
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateProfileForm()) return;
    setProfileMessage(null);
    try {
      const fullName = `${userInfo.firstName} ${userInfo.lastName}`.trim();
      await updateUser({ ...userInfo, fullName });
      setEditingSection(null);
    } catch (error) {
      if (error.code === 'DOCUMENT_TAKEN') {
        setProfileErrors((current) => ({
          ...current,
          idNumber:
            error.message || 'Este número de documento ya está registrado.',
        }));
        return;
      }

      setProfileMessage({
        type: 'error',
        text: error.message || 'No se pudieron guardar los cambios.',
      });
    }
  };

  const handlePasswordSubmit = async () => {
    if (!validatePasswordForm()) return;
    setPasswordChanging(true);
    setPasswordMessage(null);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setShowPasswordChange(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message || 'Error al actualizar la contraseña' });
    } finally {
      setPasswordChanging(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (showPasswordChange) handlePasswordSubmit();
    else if (editingSection) handleSubmit();
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
        idNumber: user.idNumber || fakeData.idNumber,
        firstName,
        lastName,
        address: user.address || fakeData.address,
        neighborhood: user.neighborhood || fakeData.neighborhood,
        email: user.email || '',
        phone: user.phone || fakeData.phone,
      });
    }
  };

  const startEdit = (section) => {
    setProfileErrors({});
    setProfileMessage(null);
    setEditingSection(section);
  };

  const togglePasswordChange = () => {
    setShowPasswordChange(!showPasswordChange);
    if (!showPasswordChange) {
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      setPasswordMessage(null);
    }
  };

  const passwordChecks = getPasswordChecks(passwordForm.newPassword);
  const passwordRequirements = [
    { key: 'minLength', label: 'Mínimo 8 caracteres' },
    { key: 'hasUpper', label: 'Una mayúscula' },
    { key: 'hasNumber', label: 'Un número' },
    { key: 'hasSpecial', label: 'Un carácter especial' },
  ];

  const renderSection = (
    title,
    icon,
    children,
    isEditing,
    onEdit,
    onCancel,
    onSave,
    editLabel = 'Editar'
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

        {profileMessage && (
          <div style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: '8px',
            background: isDark ? '#3a1a1a' : '#ffe8e8',
            border: `1px solid ${colors.error}`,
            color: colors.error,
            fontSize: '14px',
            fontWeight: '500',
          }}>
            {profileMessage.text}
          </div>
        )}

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
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{userInfo.idNumber || fakeData.idNumber}</p>
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
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{userInfo.address || fakeData.address}</p>
                    </div>
                    <div>
                      <strong style={{ color: colors.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Barrio</strong>
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{userInfo.neighborhood || fakeData.neighborhood}</p>
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
                    <FormTextField
                      label="Barrio"
                      type="text"
                      name="neighborhood"
                      value={userInfo.neighborhood}
                      onChange={(value) => handleChange('neighborhood', value)}
                      error={profileErrors.neighborhood}
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
          handleSubmit
        )}

        {/* Sección 2: Contraseña */}
        {renderSection(
          'Contraseña',
          'fa-lock',
          (
            <>
              {!showPasswordChange ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: colors.text, fontSize: '15px' }}>
                  <div style={{ padding: '16px', background: colors.inputBg, borderRadius: '8px', border: `1px solid ${colors.inputBorder}` }}>
                    <strong style={{ color: colors.textMuted, fontSize: '13px', textTransform: 'uppercase' }}>Contraseña actual</strong>
                    <div style={{
                      marginTop: '8px',
                      padding: '12px',
                      background: isDark ? '#181013' : '#f5f5f5',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      letterSpacing: '2px',
                      color: colors.text,
                    }}>
                      {'••••••••'}
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: '13px', color: colors.textMuted }}>
                      Tu contraseña está protegida. Haz clic en "Cambiar contraseña" para actualizarla.
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {passwordMessage && (
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: passwordMessage.type === 'success'
                        ? (isDark ? '#1a3a2a' : '#d8f3dc')
                        : (isDark ? '#3a1a1a' : '#ffe8e8'),
                      border: `1px solid ${passwordMessage.type === 'success' ? colors.success : colors.error}`,
                      color: passwordMessage.type === 'success' ? colors.success : colors.error,
                      fontSize: '14px',
                      fontWeight: '500',
                    }}>
                      {passwordMessage.text}
                    </div>
                  )}
                  <FormTextField
                    label="Contraseña actual"
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(value) => handlePasswordChange('currentPassword', value)}
                    error={passwordErrors.currentPassword}
                  />
                  <FormTextField
                    label="Nueva contraseña"
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(value) => handlePasswordChange('newPassword', value)}
                    error={passwordErrors.newPassword}
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', lineHeight: '1.6' }}>
                    {passwordRequirements.map((req, index) => {
                      const ok = passwordChecks[req.key];
                      return (
                        <div
                          key={req.key}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: index < passwordRequirements.length - 1 ? '4px' : 0 }}
                        >
                          <i
                            className={`fa-solid ${ok ? 'fa-circle-check' : 'fa-circle-xmark'}`}
                            style={{ color: ok ? colors.success : colors.error }}
                            aria-hidden="true"
                          />
                          <span style={{ color: ok ? colors.success : colors.error, fontWeight: '600' }}>
                            {req.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <FormTextField
                    label="Confirmar nueva contraseña"
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(value) => handlePasswordChange('confirmPassword', value)}
                    error={passwordErrors.confirmPassword}
                  />
                </div>
              )}
            </>
          ),
          showPasswordChange,
          () => togglePasswordChange(),
          () => {
            setShowPasswordChange(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordErrors({});
            setPasswordMessage(null);
          },
          handlePasswordSubmit,
          'Cambiar contraseña'
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
                      <p style={{ margin: '4px 0 0', fontWeight: '500' }}>{userInfo.phone || fakeData.phone}</p>
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
          handleSubmit
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