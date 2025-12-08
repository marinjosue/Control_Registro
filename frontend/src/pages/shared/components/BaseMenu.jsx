import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Toast } from 'primereact/toast';
import { useAuth } from '../../../context/AuthContext';
import PropTypes from 'prop-types';
import ProfileEditModal from './ProfileEditModal';
import PasswordChangeModal from './PasswordChangeModal';
import '../styles/MenuNew.css';

const BaseMenu = ({ menuConfig, children }) => {
    const [visible, setVisible] = useState(false);
    const [expandedItems, setExpandedItems] = useState({});
    const { logout, user } = useAuth();
    const [editProfileModal, setEditProfileModal] = useState(false);
    const [changePasswordModal, setChangePasswordModal] = useState(false);
    const toast = useRef(null);

    const showSuccess = (message) => {
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: message });
    };

    const toggleMenuGroup = (index) => {
        setExpandedItems(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const allMenuItems = [
        ...menuConfig.menuItems.map(item => ({
            ...item,
            isPrimary: true  // Todos los items del menuConfig son primarios
        })),
        {
            label: 'Perfil',
            icon: 'pi pi-user',
            isPrimary: true,  // Perfil también es primario
            items: [
                {
                    label: 'Editar Perfil',
                    icon: 'pi pi-user-edit',
                    action: () => setEditProfileModal(true)
                },
                {
                    label: 'Editar Contraseña',
                    icon: 'pi pi-key',
                    action: () => setChangePasswordModal(true)
                },
                {
                    label: 'Salir',
                    icon: 'pi pi-sign-out',
                    action: logout
                }
            ]
        }
    ];

    const renderMenuItems = (items) => {
        return items.map((item, index) => {
            if (item.isHeader) {
                return (
                    <div key={index} className="custom-menu-header">
                        <i className={`${item.icon} menu-icon`}></i>
                        <span className="menu-label">{item.label}</span>
                    </div>
                );
            }

            // Items con subitems (expandibles)
            if (item.items && item.items.length > 0) {
                const isExpanded = expandedItems[index];
                return (
                    <div key={index} className="custom-menu-group">
                        <button
                            className="custom-menu-item custom-menu-button primary-button"
                            onClick={() => toggleMenuGroup(index)}
                            style={{
                                background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
                                color: '#ffffff'
                            }}
                        >
                            <i className={`${item.icon} menu-icon`}></i>
                            <span className="menu-label">{item.label}</span>
                            <i className={`pi ${isExpanded ? 'pi-chevron-up' : 'pi-chevron-down'} menu-arrow`}></i>
                        </button>
                        {isExpanded && (
                            <div className="custom-submenu">
                                {item.items.map((subitem, subindex) => (
                                    <button
                                        key={subindex}
                                        className="custom-menu-item custom-submenu-item secondary-button"
                                        onClick={subitem.action || subitem.command}
                                        style={{
                                            background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
                                            color: '#ffffff'
                                        }}
                                    >
                                        <i className={`${subitem.icon} menu-icon`}></i>
                                        <span className="menu-label">{subitem.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }

            // Items simples (sin subitems)
            return (
                <button
                    key={index}
                    className="custom-menu-item custom-menu-button primary-button"
                    onClick={item.command}
                    style={{
                        background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)',
                        color: '#ffffff'
                    }}
                >
                    <i className={`${item.icon} menu-icon`}></i>
                    <span className="menu-label">{item.label}</span>
                </button>
            );
        });
    };

    return (
        <>
            <Toast ref={toast} />

            {/* Menú fijo para escritorio */}
            <div className="hidden md:flex desktop-sidebar">
                <div className="user-profile-header">
                    <Avatar
                        label={user?.nombre_usuario?.charAt(0)?.toUpperCase() || 'U'}
                        shape="circle"
                        className="user-avatar"
                    />
                    <div>
                        <div className="user-name" style={{ color: '#ffffff' }}>
                            {user?.nombre_usuario || 'Usuario'}
                        </div>
                        <div className="user-email" style={{ color: '#ffffff' }}>
                            {user?.correo || 'Sin correo'}
                        </div>
                        <div className="user-role" style={{ color: '#ffffff' }}>
                            {user?.rol || 'Sin rol'}
                        </div>
                    </div>
                </div>
                <div className="menu-container">
                    {renderMenuItems(allMenuItems)}
                </div>
                <div className="menu-footer">
                    <small className="footer-text" style={{ color: '#ffffff' }}>
                        © 2025 {menuConfig.footerText}
                    </small>
                </div>
            </div>

            {/* Menú móvil */}
            {visible && (
                <div className="md:hidden mobile-sidebar">
                    <div className="mobile-menu-close">
                        <button onClick={() => setVisible(false)} className="close-btn">
                            <i className="pi pi-times"></i>
                        </button>
                    </div>
                    <div className="menu-container">
                        {renderMenuItems(allMenuItems)}
                    </div>
                </div>
            )}

            {/* Botón hamburguesa para móviles - SOLO VISIBLE EN MÓVIL */}
            <div className="md:hidden">
                <Button
                    icon="pi pi-bars"
                    onClick={() => setVisible(!visible)}
                    className="p-button-text p-button-rounded mobile-toggle"
                />
            </div>

            <ProfileEditModal
                visible={editProfileModal}
                onHide={() => setEditProfileModal(false)}
                user={user}
                onSuccess={showSuccess}
            />
            <PasswordChangeModal
                visible={changePasswordModal}
                onHide={() => setChangePasswordModal(false)}
                onSuccess={showSuccess}
            />
        </>
    );
};

BaseMenu.propTypes = {
    menuConfig: PropTypes.object.isRequired,
    children: PropTypes.node
};

export default BaseMenu;
