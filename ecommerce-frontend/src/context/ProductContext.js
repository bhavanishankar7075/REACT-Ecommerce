import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const ProductContext = createContext();

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Capitalization mapping for mainCategory to match frontend filter expectations
  const capitalizeMainCategory = (mainCategory) => {
    const categoryMap = {
      'fashion': 'Fashion',
      'gadgets': 'Gadgets',
      'furniture': 'Furniture',
      'mobiles': 'Mobiles',
      'appliances': 'Appliances',
      'beauty': 'Beauty',
      'home': 'Home',
      'toys & baby': 'Toys & Baby',
      'sports': 'Sports',
      // Add other mappings as needed
    };
    return categoryMap[mainCategory.toLowerCase()] || mainCategory;
  };

  // Fetch all products when the provider mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { mainCategory, subcategory, nestedCategory } = filters;
      const params = new URLSearchParams();

      // Construct the category path based on provided filters with exact capitalization
      let categoryPath = '';
      if (mainCategory) {
        categoryPath = mainCategory;
        if (subcategory) {
          categoryPath += `/${subcategory}`;
          if (nestedCategory) {
            categoryPath += `/${nestedCategory}`;
          }
        }
        params.append('category', categoryPath);
      }

      const res = await axios.get(`https://backend-ps76.onrender.com/api/products?${params.toString()}`);
      console.log('Raw product data from backend:', res.data);
      const fetchedProducts = res.data.map((item) => {
        // Handle main image: Use as-is if it's a full URL (e.g., Cloudinary), otherwise use a placeholder
        const image =
          item.image && typeof item.image === 'string'
            ? item.image.startsWith('http://') || item.image.startsWith('https://')
              ? item.image
              : 'https://placehold.co/150?text=No+Image'
            : 'https://placehold.co/150?text=No+Image';

        // Handle additional images: Same logic as main image
        const images =
          item.images && Array.isArray(item.images)
            ? item.images.map((img) =>
                typeof img === 'string'
                  ? img.startsWith('http://') || img.startsWith('https://')
                    ? img
                    : 'https://placehold.co/150?text=No+Image'
                  : 'https://placehold.co/150?text=No+Image'
              )
            : [];

        // Handle variant images
        const variants =
          item.variants && Array.isArray(item.variants)
            ? item.variants.map((variant) => ({
                variantId: variant.variantId || '',
                mainImage:
                  variant.mainImage && typeof variant.mainImage === 'string'
                    ? variant.mainImage.startsWith('http://') || variant.mainImage.startsWith('https://')
                      ? variant.mainImage
                      : 'https://placehold.co/150?text=No+Image'
                    : 'https://placehold.co/150?text=No+Image',
                additionalImages:
                  variant.additionalImages && Array.isArray(variant.additionalImages)
                    ? variant.additionalImages.map((img) =>
                        typeof img === 'string'
                          ? img.startsWith('http://') || img.startsWith('https://')
                            ? img
                            : 'https://placehold.co/150?text=No+Image'
                          : 'https://placehold.co/150?text=No+Image'
                      )
                    : [],
                specifications: variant.specifications || {},
              }))
            : [];

        // Ensure sizes is an array
        const sizes = Array.isArray(item.sizes) ? item.sizes : [];

        // Preserve the original capitalization of subcategory and nestedCategory, but map mainCategory
        const originalCategory = item.category || 'Uncategorized';
        const categoryParts = originalCategory.split('/');
        const rawMainCategory = categoryParts[0] || 'Uncategorized';
        const mainCategoryPart = capitalizeMainCategory(rawMainCategory); // Map to correct capitalization
        const subcategoryPart = item.subcategory || ''; // Preserve backend capitalization
        const nestedCategoryPart = item.nestedCategory || ''; // Preserve backend capitalization

        // Reconstruct the full category path with the mapped mainCategory
        const fullCategoryPath = [mainCategoryPart, subcategoryPart, nestedCategoryPart]
          .filter(Boolean)
          .join('/');

        return {
          _id: item._id || '',
          name: item.name || '',
          price: Number(item.price) || 0,
          discountedPrice: Number(item.discountedPrice) || 0,
          stock: Number(item.stock) || 0,
          image,
          images,
          variants, // Include variants with their images and specs
          category: fullCategoryPath || 'Uncategorized', // Full path: "Fashion/Men/Top Wear"
          mainCategory: mainCategoryPart,
          subcategory: subcategoryPart,
          nestedCategory: nestedCategoryPart,
          featured: item.featured || false,
          description: item.description || '',
          brand: item.brand || '',
          weight: Number(item.weight) || 0,
          weightUnit: item.weightUnit || 'kg',
          model: item.model || '',
          offer: item.offer || '',
          sizes,
          isActive: item.isActive !== undefined ? item.isActive : true,
          dealTag: item.dealTag || '',
          seller: item.seller || '',
          specifications: item.specifications || {},
          warranty: item.warranty || '',
          packOf: item.packOf || '',
        };
      });
      console.log('Processed products:', fetchedProducts);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.response?.data?.message || 'Failed to fetch products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch a single product by ID (useful for ProductDetails.js)
  const fetchProductById = async (productId) => {
    try {
      const res = await axios.get(`https://backend-ps76.onrender.com/api/products/${productId}`);
      console.log('Raw product data for ID', productId, ':', res.data);
      const item = res.data;

      // Handle main image: Use as-is if it's a full URL (e.g., Cloudinary), otherwise use a placeholder
      const image =
        item.image && typeof item.image === 'string'
          ? item.image.startsWith('http://') || item.image.startsWith('https://')
            ? item.image
            : 'https://placehold.co/150?text=No+Image'
          : 'https://placehold.co/150?text=No+Image';

      // Handle additional images: Same logic as main image
      const images =
        item.images && Array.isArray(item.images)
          ? item.images.map((img) =>
              typeof img === 'string'
                ? img.startsWith('http://') || img.startsWith('https://')
                  ? img
                  : 'https://placehold.co/150?text=No+Image'
                : 'https://placehold.co/150?text=No+Image'
            )
          : [];

      // Handle variant images
      const variants =
        item.variants && Array.isArray(item.variants)
          ? item.variants.map((variant) => ({
              variantId: variant.variantId || '',
              mainImage:
                variant.mainImage && typeof variant.mainImage === 'string'
                  ? variant.mainImage.startsWith('http://') || variant.mainImage.startsWith('https://')
                    ? variant.mainImage
                    : 'https://placehold.co/150?text=No+Image'
                  : 'https://placehold.co/150?text=No+Image',
              additionalImages:
                variant.additionalImages && Array.isArray(variant.additionalImages)
                  ? variant.additionalImages.map((img) =>
                      typeof img === 'string'
                        ? img.startsWith('http://') || img.startsWith('https://')
                          ? img
                          : 'https://placehold.co/150?text=No+Image'
                        : 'https://placehold.co/150?text=No+Image'
                    )
                  : [],
              specifications: variant.specifications || {},
            }))
          : [];

      const sizes = Array.isArray(item.sizes) ? item.sizes : [];

      // Preserve the original capitalization of subcategory and nestedCategory, but map mainCategory
      const originalCategory = item.category || 'Uncategorized';
      const categoryParts = originalCategory.split('/');
      const rawMainCategory = categoryParts[0] || 'Uncategorized';
      const mainCategoryPart = capitalizeMainCategory(rawMainCategory); // Map to correct capitalization
      const subcategoryPart = item.subcategory || ''; // Preserve backend capitalization
      const nestedCategoryPart = item.nestedCategory || ''; // Preserve backend capitalization

      // Reconstruct the full category path with the mapped mainCategory
      const fullCategoryPath = [mainCategoryPart, subcategoryPart, nestedCategoryPart]
        .filter(Boolean)
        .join('/');

      const product = {
        _id: item._id || '',
        name: item.name || '',
        price: Number(item.price) || 0,
        discountedPrice: Number(item.discountedPrice) || 0,
        stock: Number(item.stock) || 0,
        image,
        images,
        variants, // Include variants with their images and specs
        category: fullCategoryPath || 'Uncategorized', // Full path: "Fashion/Men/Top Wear"
        mainCategory: mainCategoryPart,
        subcategory: subcategoryPart,
        nestedCategory: nestedCategoryPart,
        featured: item.featured || false,
        description: item.description || '',
        brand: item.brand || '',
        weight: Number(item.weight) || 0,
        weightUnit: item.weightUnit || 'kg',
        model: item.model || '',
        offer: item.offer || '',
        sizes,
        isActive: item.isActive !== undefined ? item.isActive : true,
        dealTag: item.dealTag || '',
        seller: item.seller || '',
        specifications: item.specifications || {},
        warranty: item.warranty || '',
        packOf: item.packOf || '',
      };

      console.log('Processed product:', product);
      return product;
    } catch (err) {
      console.error('Error fetching product by ID:', err);
      throw new Error(err.response?.data?.message || 'Failed to fetch product');
    }
  };

  const value = {
    products,
    loading,
    error,
    fetchProducts,
    fetchProductById,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export const useProducts = () => useContext(ProductContext);
