import { Product } from '../types';

export const HERO_BANNER_IMAGE = '/src/assets/images/hero_atelier_collection_1795362625170.jpg';

export const STUDIO_IMAGE_PRESETS = [
  {
    label: "Men's Oxford Shirt",
    url: '/src/assets/images/mens_oxford_shirt_1795362625840.jpg',
  },
  {
    label: "Men's Selvedge Jeans",
    url: '/src/assets/images/mens_selvedge_jeans_1795362625661.jpg',
  },
  {
    label: "Men's Wool Jacket",
    url: '/src/assets/images/mens_wool_jacket_1795362624956.jpg',
  },
  {
    label: "Women's Linen Dress",
    url: '/src/assets/images/womens_midi_dress_1795362625605.jpg',
  },
  {
    label: "Women's Tailored Trousers",
    url: '/src/assets/images/womens_wide_trousers_1795362625426.jpg',
  },
  {
    label: "Women's Combed Tee",
    url: '/src/assets/images/womens_cotton_tee_1795362625698.jpg',
  },
  {
    label: "Kids' Chambray Set",
    url: '/src/assets/images/kids_chambray_set_1795362625779.jpg',
  },
  {
    label: "Kids' Fleece Tracksuit",
    url: '/src/assets/images/kids_fleece_crew_1795362625879.jpg',
  },
];

export const SEED_PRODUCTS: Omit<Product, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'prod_mens_oxford_shirt',
    name: 'Brushed Oxford Tailored Shirt',
    category: "Men's Wear",
    garmentType: 'Shirts',
    description:
      'Cut from long-staple brushed cotton oxford with a structured collar roll, single-needle felled seams, and mother-of-pearl buttons. Designed for crisp everyday layering.',
    price: 88,
    imageUrl: '/src/assets/images/mens_oxford_shirt_1795362625840.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Slate Blue', 'Chalk White', 'Charcoal'],
    stock: 24,
    featured: true,
  },
  {
    id: 'prod_mens_selvedge_jeans',
    name: '13.5oz Japanese Selvedge Jeans',
    category: "Men's Wear",
    garmentType: 'Jeans',
    description:
      'Rope-dyed dark indigo shuttle-loom selvedge denim with a balanced straight-tapered silhouette, copper rivets, and chain-stitched hem.',
    price: 148,
    imageUrl: '/src/assets/images/mens_selvedge_jeans_1795362625661.jpg',
    sizes: ['30', '32', '34', '36'],
    colors: ['Raw Indigo', 'Washed Slate'],
    stock: 18,
    featured: true,
  },
  {
    id: 'prod_mens_wool_jacket',
    name: 'Merino Wool Structured Chore Jacket',
    category: "Men's Wear",
    garmentType: 'Jackets',
    description:
      'Tailored three-button chore jacket woven from double-faced merino wool blend with reinforced patch pockets, horn buttons, and clean interior piping.',
    price: 235,
    imageUrl: '/src/assets/images/mens_wool_jacket_1795362624956.jpg',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Charcoal', 'Midnight Navy'],
    stock: 12,
    featured: true,
  },
  {
    id: 'prod_womens_midi_dress',
    name: 'Pleated Linen-Blend Wrap Dress',
    category: "Women's Wear",
    garmentType: 'Dresses',
    description:
      'Breathable European flax linen blended with drape-enhancing viscose. Features fine sunray pleating across the skirt and an adjustable waist tie.',
    price: 165,
    imageUrl: '/src/assets/images/womens_midi_dress_1795362625605.jpg',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Ivory Stone', 'Obsidian', 'Sage'],
    stock: 16,
    featured: true,
  },
  {
    id: 'prod_womens_wide_trousers',
    name: 'High-Waisted Tailored Wool Trousers',
    category: "Women's Wear",
    garmentType: 'Trousers',
    description:
      'Fluid wide-leg trousers tailored from crisp worsted wool twill with double front pleats, concealed hook-and-bar closure, and full cupro half-lining.',
    price: 142,
    imageUrl: '/src/assets/images/womens_wide_trousers_1795362625426.jpg',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['Obsidian Black', 'Warm Sand'],
    stock: 20,
    featured: true,
  },
  {
    id: 'prod_womens_cotton_tee',
    name: 'Heavyweight Organic Cotton Crew Tee',
    category: "Women's Wear",
    garmentType: 'T-Shirts',
    description:
      '260gsm organic combed jersey knit with a dense ribbed collar that holds its shape wash after wash. Relaxed architectural drape.',
    price: 48,
    imageUrl: '/src/assets/images/womens_cotton_tee_1795362625698.jpg',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Oatmeal Ivory', 'Slate', 'Obsidian'],
    stock: 32,
    featured: false,
  },
  {
    id: 'prod_kids_chambray_set',
    name: 'Organic Chambray Shirt & Chino Set',
    category: "Kids' Wear",
    garmentType: 'Shirts',
    description:
      'Pre-washed lightweight cotton chambray button-down paired with soft elastic-waist twill chino shorts for effortless movement and durability.',
    price: 64,
    imageUrl: '/src/assets/images/kids_chambray_set_1795362625779.jpg',
    sizes: ['4Y', '6Y', '8Y', '10Y'],
    colors: ['Sky Chambray', 'Stone'],
    stock: 22,
    featured: true,
  },
  {
    id: 'prod_kids_fleece_crew',
    name: 'Loopback Fleece Sweatshirt & Joggers',
    category: "Kids' Wear",
    garmentType: 'Trousers',
    description:
      'All-season 320gsm organic cotton loopback fleece crewneck and matching drawstring joggers with reinforced knees and soft ribbed cuffs.',
    price: 72,
    imageUrl: '/src/assets/images/kids_fleece_crew_1795362625879.jpg',
    sizes: ['4Y', '6Y', '8Y', '10Y', '12Y'],
    colors: ['Sage Green', 'Heather Slate'],
    stock: 25,
    featured: false,
  },
];
