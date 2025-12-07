import React, { useState, useEffect } from 'react';
import { Sidebar } from 'primereact/sidebar';
import { PanelMenu } from 'primereact/panelmenu';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Toast } from 'primereact/toast';
import { useAuth } from '../../../context/AuthContext';
import PropTypes from 'prop-types';
import ProfileEditModal from './ProfileEditModal';
import PasswordChangeModal from './PasswordChangeModal';
import '../styles/MenuStyles.css';

const BaseMenu = ({ menuConfig, children }) => {
    const [visible, setVisible] = useState(false);
    const { logout, user } = useAuth();
    const [editProfileModal, setEditProfileModal] = useState(false);
    const [changePasswordModal, setChangePasswordModal] = useState(false);
    const toast = React.useRef(null);

    const showSuccess = (message) => {
        toast.current.show({ severity: 'success', summary: 'Éxito', detail: message });
    };

    // Aplicar estilos oscuros a los elementos de menú
    useEffect(() => {
        // Función para aplicar estilos oscuros
        const applyDarkStyles = () => {
            // Para el menú móvil y desktop - headers principales
            const menuHeaders = document.querySelectorAll('.dark-menu .p-panelmenu-header-link, .dark-menu-mobile .p-panelmenu-header-link');
            menuHeaders.forEach(header => {
                header.style.backgroundColor = 'transparent';
                header.style.color = 'rgba(255, 255, 255, 0.95)';
                header.style.border = 'none';
                header.style.outline = 'none';
                header.style.boxShadow = 'none';
            });

            // Para todos los elementos de menú (principales y submenús)
            const menuItems = document.querySelectorAll('.dark-menu .p-menuitem-link, .dark-menu-mobile .p-menuitem-link');
            menuItems.forEach(item => {
                item.style.backgroundColor = 'transparent';
                item.style.color = 'rgba(255, 255, 255, 0.95)';
                item.style.border = 'none';
                item.style.outline = 'none';
                item.style.boxShadow = 'none';
                item.style.margin = '0';

                // Asegurar que los iconos también sean blancos
                const icon = item.querySelector('i');
                if (icon) {
                    icon.style.color = 'rgba(255, 255, 255, 0.9)';
                }

                // Asegurar que el texto también sea blanco
                const textNode = item.querySelector('.p-menuitem-text');
                if (textNode) {
                    textNode.style.color = 'rgba(255, 255, 255, 0.95)';
                }
            });

            // Para los contenedores de submenús
            const menuContents = document.querySelectorAll('.dark-menu .p-panelmenu-content, .dark-menu-mobile .p-panelmenu-content');
            menuContents.forEach(content => {
                content.style.backgroundColor = 'rgba(0, 0, 0, 0.15)';
                content.style.border = 'none';
                content.style.outline = 'none';
                content.style.boxShadow = 'none';
                content.style.padding = '0.25rem 0';
                content.style.margin = '0';
            });

            // Para los contenedores de listas de submenús
            const submenuContainers = document.querySelectorAll('.dark-menu .p-submenu-list, .dark-menu-mobile .p-submenu-list');
            submenuContainers.forEach(container => {
                container.style.backgroundColor = 'transparent';
                container.style.padding = '0';
                container.style.margin = '0';
                container.style.border = 'none';
                container.style.outline = 'none';
                container.style.boxShadow = 'none';
            });

            // Íconos de expansión
            const expandIcons = document.querySelectorAll('.dark-menu .p-submenu-icon, .dark-menu-mobile .p-submenu-icon, .dark-menu .p-panelmenu-icon, .dark-menu-mobile .p-panelmenu-icon');
            expandIcons.forEach(icon => {
                icon.style.color = 'rgba(255, 255, 255, 0.9)';
            });

            // Eliminar bordes de todos los elementos de menú
            const allMenuItems = document.querySelectorAll('.dark-menu .p-menuitem, .dark-menu-mobile .p-menuitem');
            allMenuItems.forEach(item => {
                item.style.border = 'none';
                item.style.outline = 'none';
                item.style.boxShadow = 'none';
                item.style.margin = '0';
                item.style.padding = '0';
            });

            // Asegurar que no hay bordes en las listas de menú
            const menuLists = document.querySelectorAll('.dark-menu .p-menuitem-list, .dark-menu-mobile .p-menuitem-list');
            menuLists.forEach(list => {
                list.style.backgroundColor = 'transparent';
                list.style.margin = '0';
                list.style.padding = '0';
                list.style.border = 'none';
                list.style.outline = 'none';
                list.style.boxShadow = 'none';
            });

            // Eliminar bordes de los paneles
            const panels = document.querySelectorAll('.dark-menu .p-panelmenu-panel, .dark-menu-mobile .p-panelmenu-panel');
            panels.forEach(panel => {
                panel.style.border = 'none';
                panel.style.outline = 'none';
                panel.style.boxShadow = 'none';
                panel.style.margin = '0.25rem 0';
                panel.style.backgroundColor = 'transparent';
            });

            // Asegurar que todos los iconos sean blancos
            const allIcons = document.querySelectorAll('.dark-menu i, .dark-menu-mobile i');
            allIcons.forEach(icon => {
                icon.style.color = 'rgba(255, 255, 255, 0.9)';
            });

            // Asegurar que todo el texto sea blanco
            const allText = document.querySelectorAll('.dark-menu .p-menuitem-text, .dark-menu-mobile .p-menuitem-text');
            allText.forEach(text => {
                text.style.color = 'rgba(255, 255, 255, 0.95)';
            });
        };

        // Aplicar estilos inmediatamente y después de un pequeño retardo para asegurar que se apliquen
        applyDarkStyles();
        setTimeout(applyDarkStyles, 100);
        setTimeout(applyDarkStyles, 300);

        // Observar cambios en el DOM para aplicar estilos cuando se expandan submenús
        const observer = new MutationObserver(() => {
            applyDarkStyles();
            // Aplicar de nuevo después de un pequeño retardo para asegurar que se aplique
            setTimeout(applyDarkStyles, 50);
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });

        return () => observer.disconnect();
    }, [visible]);

    // Modificar los elementos del menú para aplicar estilos
    const modifyMenuItems = (items) => {
        return items.map(item => {
            let newItem = { ...item };

            // Añadir estilos personalizados al item sin bordes
            newItem.style = {
                backgroundColor: 'var(--menu-bg-secondary)',
                color: 'var(--menu-text-primary)', // <-- Cambia aquí a primary (blanco)
                border: 'none',
                borderRadius: '0.5rem',
                margin: '2px 0'
            };

            // Si tiene subitems, aplicar estilos recursivamente
            if (newItem.items) {
                newItem.items = modifyMenuItems(newItem.items);

                // Estilos específicos para subitems
                newItem.items.forEach(subitem => {
                    subitem.className = 'menu-subitem';
                });
            }

            return newItem;
        });
    };

    // Modificar los elementos del menú para aplicar estilos
    const baseItems = modifyMenuItems([
        {
            label: menuConfig.appName,
            icon: menuConfig.appIcon
        },
        ...menuConfig.menuItems,
        {
            label: 'Perfil',
            icon: 'pi pi-user',
            items: [
                {
                    label: 'Editar Perfil',
                    icon: 'pi pi-user-edit',
                    command: () => setEditProfileModal(true)
                },
                {
                    label: 'Editar Contraseña',
                    icon: 'pi pi-key',
                    command: () => setChangePasswordModal(true)
                },
                {
                    label: 'Salir',
                    icon: 'pi pi-sign-out',
                    command: logout
                }
            ]
        }
    ]);

    return (
        <>
            <Toast ref={toast} />

            {/* Botón hamburguesa para móviles */}
            <div className="mobile-menu-button md:hidden">
                <Button
                    icon="pi pi-bars"
                    onClick={() => setVisible(!visible)}
                    className="p-button-text p-button-rounded"
                />
            </div>

            {/* Sidebar móvil */}
            <Sidebar
                visible={visible}
                onHide={() => setVisible(false)}
                className="md:hidden mobile-sidebar"
                modal={false}
                dismissable={false}
                closeOnEscape={false}
            >
                <div className="mobile-menu-content">
                    <div className="menu-container">
                        <PanelMenu
                            model={baseItems}
                            className="dark-menu-mobile panel-menu-custom"
                        />
                    </div>
                </div>
            </Sidebar>

            {/* Sidebar fijo para escritorio */}
            <div className="hidden md:flex desktop-sidebar">
                <div className="user-profile-header">
                    <Avatar
                        label={user?.nombre_usuario?.charAt(0)?.toUpperCase() || 'U'}
                        shape="circle"
                        className="user-avatar"
                    />
                    <div>
                        <div className="user-name">
                            {user?.nombre_usuario || 'Usuario'}
                        </div>
                        <div className="user-email">
                            {user?.correo || 'Sin correo'}
                        </div>
                        <div className="user-role">
                            {user?.rol || 'Sin rol'}
                        </div>
                    </div>
                </div>
                <div className="menu-container">
                    <PanelMenu
                        model={baseItems}
                        className="dark-menu panel-menu-custom"
                    />
                </div>
                <div className="menu-footer">
                    <small className="footer-text">
                        © 2025 {menuConfig.footerText}
                    </small>
                </div>
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
                user={user}
                onSuccess={showSuccess}
            />

            {children}
        </>
    );
};

BaseMenu.propTypes = {
    menuConfig: PropTypes.shape({
        appName: PropTypes.string.isRequired,
        appIcon: PropTypes.string.isRequired,
        menuItems: PropTypes.array.isRequired,
        footerText: PropTypes.string.isRequired
    }).isRequired,
    children: PropTypes.node
};

export default BaseMenu;
