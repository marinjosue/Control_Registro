const fs = require('fs');
const path = require('path');

const rawDataPath = path.join(__dirname, 'src', 'data', 'raw_products.txt');
const outputPath = path.join(__dirname, 'src', 'data', 'products.json');

try {
    const rawContent = fs.readFileSync(rawDataPath, 'utf8');

    // Split by product markers
    // The file starts with 'Productos: "' and then has '", Producto1: "', '", Producto 2: "', etc.
    // We can split by /", Producto\s*\d+:\s*"/ or similar.
    // First, let's normalize the start.

    const parts = rawContent.split(/",\s*Producto\s*\d+:\s*"/);

    // The first part is "Productos: " + list HTML. We might want to skip it or use it if needed.
    // The subsequent parts are the product details.
    // Let's check if the first part contains "Productos: " and remove it.

    const products = [];

    // Helper to extract data using regex
    const extract = (html, regex) => {
        const match = html.match(regex);
        return match ? match[1].trim() : null;
    };

    const extractAll = (html, regex) => {
        const matches = [];
        let match;
        while ((match = regex.exec(html)) !== null) {
            matches.push(match[1]);
        }
        return matches;
    };

    // Process each part (skipping the first one which is the list view, unless we need it)
    // Actually, the first part is the list view. Let's see if we can get data from it?
    // The user wants "todos los datos de los 8 productos". 
    // The split might leave the first element as the list.
    // Let's iterate from index 1 to get the detailed products.

    // Wait, if the file was constructed by appending, the first part is the list, and then product 1, 2, etc.
    // Let's look at the parts.

    for (let i = 1; i < parts.length; i++) {
        const html = parts[i];

        // Extract fields
        const name = extract(html, /<h1[^>]*data-hook="product-title"[^>]*>(.*?)<\/h1>/);
        const price = extract(html, /<span[^>]*data-hook="formatted-primary-price"[^>]*>(.*?)<\/span>/);
        const sku = extract(html, /<div[^>]*data-hook="sku"[^>]*>SKU:\s*(.*?)<\/div>/);
        let description = extract(html, /<pre[^>]*data-hook="description"[^>]*>([\s\S]*?)<\/pre>/);

        // Extract Warranty and Origin
        const warrantyMatch = html.match(/<h2[^>]*data-hook="info-section-title"[^>]*>\s*POLÍTICA DE GARANTIA\s*<\/h2>[\s\S]*?<div[^>]*data-hook="info-section-description"[^>]*>([\s\S]*?)<\/div>/);
        const warranty = warrantyMatch ? warrantyMatch[1].trim() : null;

        const originMatch = html.match(/<h2[^>]*data-hook="info-section-title"[^>]*>\s*PROCEDENCIA DE LA APARATOLOGÍA\s*<\/h2>[\s\S]*?<div[^>]*data-hook="info-section-description"[^>]*>([\s\S]*?)<\/div>/);
        const origin = originMatch ? originMatch[1].trim() : null;

        // Clean description HTML if needed, or keep it as HTML
        // The user might want text. Let's keep HTML for now as it has formatting.

        // Images
        // Look for wow-image data-image-info
        // data-image-info="{&quot;displayMode&quot;:&quot;fill&quot;,&quot;isLQIP&quot;:true,&quot;isSEOBot&quot;:false,&quot;lqipTransition&quot;:null,&quot;encoding&quot;:&quot;AVIF&quot;,&quot;imageData&quot;:{&quot;width&quot;:190,&quot;height&quot;:360,&quot;uri&quot;:&quot;4bd4fb_4f2227521f834cbaae5fba7b86a2447d~mv2.png&quot;

        const imageInfos = extractAll(html, /data-image-info="([^"]*)"/g);
        const images = imageInfos.map(info => {
            try {
                const decoded = info.replace(/&quot;/g, '"');
                const json = JSON.parse(decoded);
                return `https://static.wixstatic.com/media/${json.imageData.uri}`;
            } catch (e) {
                return null;
            }
        }).filter(img => img !== null);

        // Remove duplicates
        const uniqueImages = [...new Set(images)];

        if (name) {
            products.push({
                id: i, // Simple ID
                name,
                price,
                sku: sku || '',
                description: description || '',
                warranty: warranty || '',
                origin: origin || '',
                images: uniqueImages,
                category: 'Aparatología' // Default category or infer
            });
        }
    }

    // If we only found a few products (e.g. 3), but the list view (part 0) has 8, we might need to parse part 0.
    // Let's check part 0 for list items if we have few products.

    if (products.length < 8) {
        console.log(`Found only ${products.length} detailed products. Checking list view...`);
        const listHtml = parts[0];
        // Parse list items
        // <li data-hook="product-list-grid-item">
        // Name: <h3 ...> or <p ... data-hook="product-item-name">
        // Price: <span data-hook="product-item-price-to-pay">
        // Image: <img src="...">

        // We can split by <li data-hook="product-list-grid-item">
        const listItems = listHtml.split('<li data-hook="product-list-grid-item">');

        for (let j = 1; j < listItems.length; j++) {
            const itemHtml = listItems[j];
            const name = extract(itemHtml, /<p[^>]*data-hook="product-item-name"[^>]*>(.*?)<\/p>/);

            // Check if this product is already in our detailed list
            const exists = products.find(p => p.name === name);
            if (!exists && name) {
                const price = extract(itemHtml, /<span[^>]*data-hook="product-item-price-to-pay"[^>]*>(.*?)<\/span>/);

                // Image in list view
                // <wow-image ... data-image-info="...">
                const imageInfoMatch = itemHtml.match(/data-image-info="([^"]*)"/);
                let image = null;
                if (imageInfoMatch) {
                    try {
                        const decoded = imageInfoMatch[1].replace(/&quot;/g, '"');
                        const json = JSON.parse(decoded);
                        image = `https://static.wixstatic.com/media/${json.imageData.uri}`;
                    } catch (e) { }
                }

                products.push({
                    id: products.length + 1,
                    name,
                    price,
                    sku: '',
                    description: '', // No description in list view usually
                    images: image ? [image] : [],
                    category: 'Aparatología'
                });
            }
        }
    }

    fs.writeFileSync(outputPath, JSON.stringify(products, null, 2));
    console.log(`Successfully extracted ${products.length} products to ${outputPath}`);

} catch (err) {
    console.error('Error parsing products:', err);
}
