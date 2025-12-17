import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ProductDetail.module.css';
import products from '../../data/products.json';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState('');

    useEffect(() => {
        const foundProduct = products.find(p => p.id === parseInt(id));
        if (foundProduct) {
            setProduct(foundProduct);
            if (foundProduct.images && foundProduct.images.length > 0) {
                setSelectedImage(foundProduct.images[0]);
            }
        } else {
            // Handle not found
            navigate('/');
        }
    }, [id, navigate]);

    if (!product) return null;

    const handleWhatsAppClick = () => {
        const message = `Hola, estoy interesado en el producto: ${product.name}`;
        window.open(`https://wa.me/593999999999?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className={styles.pageContainer}>
            <Header />
            <div className={styles.container}>
                <button onClick={() => navigate('/')} className={styles.backButton}>
                    ← Volver al inicio
                </button>

                <div className={styles.grid}>
                    {/* Gallery */}
                    <div className={styles.gallery}>
                        <div className={styles.mainImageContainer}>
                            <img src={selectedImage || '/placeholder.png'} alt={product.name} className={styles.mainImage} />
                        </div>
                        {product.images && product.images.length > 1 && (
                            <div className={styles.thumbnails}>
                                {product.images.map((img, index) => (
                                    <img
                                        key={index}
                                        src={img}
                                        alt={`${product.name} ${index + 1}`}
                                        className={`${styles.thumbnail} ${selectedImage === img ? styles.active : ''}`}
                                        onClick={() => setSelectedImage(img)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className={styles.info}>
                        <h1 className={styles.title}>{product.name}</h1>
                        {/* <p className={styles.price}>{product.price}</p> */}
                        {product.sku && <p className={styles.sku}>SKU: {product.sku}</p>}

                        <div
                            className={styles.description}
                            dangerouslySetInnerHTML={{ __html: product.description }}
                        />

                        <button onClick={handleWhatsAppClick} className={styles.contactButton}>
                            <span>📱</span> Consultar por WhatsApp
                        </button>

                        {product.warranty && (
                            <div className={styles.infoSection}>
                                <h3 className={styles.infoTitle}>Política de Garantía</h3>
                                <div
                                    className={styles.infoContent}
                                    dangerouslySetInnerHTML={{ __html: product.warranty }}
                                />
                            </div>
                        )}

                        {product.origin && (
                            <div className={styles.infoSection}>
                                <h3 className={styles.infoTitle}>Procedencia de la Aparatología</h3>
                                <div
                                    className={styles.infoContent}
                                    dangerouslySetInnerHTML={{ __html: product.origin }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ProductDetail;
