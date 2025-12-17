import React from 'react';
import styles from './ProductCard.module.css';

const ProductCard = ({ product, onClick }) => {
    const { name, price, images } = product;
    const mainImage = images && images.length > 0 ? images[0] : '/placeholder.png';

    return (
        <div className={styles.card}>
            <div className={styles.imageContainer}>
                <img src={mainImage} alt={name} className={styles.image} />
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{name}</h3>
                {/* <p className={styles.price}>{price}</p> */}
                <button className={styles.button} onClick={() => onClick(product.id)}>
                    Ver Detalles
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
