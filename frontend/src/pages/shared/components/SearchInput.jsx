import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Search } from 'lucide-react';
import styles from '../styles/SearchInput.module.css';

const SearchInput = ({ value, onChange, placeholder = "Buscar...", className = "" }) => {
    return (
        <div className={`${styles.searchContainer} ${className}`}>
            <div className={styles.searchIcon}>
                <Search size={18} />
            </div>
            <InputText
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={styles.searchInput}
            />
        </div>
    );
};

export default SearchInput;
