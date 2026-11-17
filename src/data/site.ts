/**
 * DearMy Bakeshop — single source of truth for all site content.
 *
 * Everything a non-developer might need to change lives in this file.
 *
 * CONFIRMED = supplied by the business. Do not change without checking with them.
 * PLACEHOLDER = invented sample content. Must be verified or replaced before launch.
 *   Search this file for "PLACEHOLDER" to find every item.
 */

/* ------------------------------------------------------------------ */
/* Business details                                                    */
/* ------------------------------------------------------------------ */

export const business = {
  // CONFIRMED
  name: 'DearMy Bakeshop',
  taglineLead: 'We bake for',
  taglineDear: 'Dear my',
  address: {
    street: '181 Madras Street',
    precinct: 'Boxed Quarter',
    city: 'Christchurch',
    country: 'New Zealand',
  },
  phone: {
    display: '020 490 7722',
    // E.164 form of the same number, used for the tel: link.
    tel: '+64204907722',
  },
  // Google Maps directions to the confirmed street address.
  directionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=181+Madras+Street%2C+Christchurch%2C+New+Zealand',

  // PLACEHOLDER — the real Instagram account has not been supplied yet.
  // Replace `url` and `handle`, then set `isPlaceholder` to false.
  instagram: {
    isPlaceholder: true,
    url: 'https://www.instagram.com/',
    handle: '@your-handle-here',
  },
};

/**
 * While true, the page shows small "sample" notes next to placeholder prices,
 * hours, photos and the Instagram link. Set to false once everything in this
 * file has been verified.
 */
export const showPlaceholderNotes = true;

/* ------------------------------------------------------------------ */
/* The blank: "We bake for DEAR MY ____"                               */
/* ------------------------------------------------------------------ */

export const blank = {
  // PLACEHOLDER — words that cycle through the blank in the hero.
  words: ['mum', 'flatmate', 'nana', 'best mate', 'Monday self', 'neighbour', 'crush', 'dad', 'study buddy'],
  // Used around the page until a visitor writes their own word.
  fallback: 'favourite person',
  maxLength: 20,
};

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

// PLACEHOLDER — all introductory and storytelling copy below is draft wording.
export const copy = {
  hero: {
    intro:
      'A little bakeshop in the Boxed Quarter, Christchurch. Bread, pastries, cakes and cookies, all baked with somebody in mind.',
    // Set in the handwriting font, which spaces curly apostrophes badly: keep straight ones here.
    hint: "It's a real blank. Write who you're baking for.",
    primaryCta: 'See what’s baking',
    secondaryCta: 'Find the shop',
  },
  letter: {
    paragraphs: [
      'Somebody thought of you today. Around here, that usually ends in butter.',
      'Nobody buys a box of pastries for no one. There’s always a person at the other end: a mum, a flatmate, a mate who needs a win, your own Monday-morning self.',
      'So our name ends in a blank. You fill it in. We’ll do the baking.',
    ],
    signOff: 'Yours,',
  },
  bakes: {
    heading: 'Enclosed: a few things we baked',
    intro: 'Pop your favourites in your letter and we’ll have a note ready for you to send at the bottom.',
    sampleNote: 'Sample menu. Bakes and prices to be confirmed.',
    // Last tile in the grid, pointing to the order section. Handwriting font: straight apostrophes.
    askHeading: "Can't see what you're after?",
    askBody: 'Birthday cake, a big box for the office, something we haven’t thought of yet. Ask and we’ll see what we can do.',
    askCta: 'Ask us',
  },
  visit: {
    heading: 'P.S. Come say hi',
    // Handwriting font: keep the straight apostrophe.
    hoursHeading: "When we're in",
    sampleNote: 'Sample hours, to be confirmed.',
    directionsCta: 'Get directions',
  },
  order: {
    heading: 'Now write back',
    intro: 'Orders and questions come to us by Instagram message or a phone call. Your note’s already written.',
    copyCta: 'Copy my note',
    copiedLabel: 'Note copied',
    instagramCta: 'Message us on Instagram',
    instagramSampleNote: 'Instagram link to be added.',
    emptyPicks: 'Nothing picked yet. Tap “Pop it in” on any bake above, or just ask what’s good.',
  },
  footer: {
    signOff: 'Yours,',
    photoNote: 'Photos are stock images from Unsplash, standing in until our own are ready.',
  },
};

/* ------------------------------------------------------------------ */
/* Opening hours                                                       */
/* ------------------------------------------------------------------ */

// PLACEHOLDER — example opening hours only. Verify before launch.
export const hours = {
  isPlaceholder: true,
  rows: [
    { days: 'Monday', time: 'Closed' },
    { days: 'Tuesday to Friday', time: '8am – 3pm' },
    { days: 'Saturday and Sunday', time: '9am – 3pm' },
  ],
};

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */

/**
 * A photo is either an Unsplash photo id (the part after "photo-" in an
 * images.unsplash.com URL) or a local file in /public, e.g. { src: '/photos/croissant.jpg' }.
 *
 * PLACEHOLDER — every Unsplash photo is temporary stock imagery. None of them
 * show DearMy Bakeshop's own products or premises. Swap for real photos when available.
 */
export type Photo = {
  unsplashId?: string;
  src?: string;
  /** Any public https image (e.g. from the Google Sheet). Downloaded and optimised at build time. */
  url?: string;
  alt: string;
};

export const photos = {
  heroTop: {
    unsplashId: '1589007797526-ed40d157365d',
    alt: 'Golden croissants on a white plate',
  },
  heroMiddle: {
    unsplashId: '1627308595171-d1b5d67129c4',
    alt: 'Slices of strawberry and cream layer cake',
  },
  heroBottom: {
    unsplashId: '1634188023615-7e08901193b6',
    alt: 'Chocolate chip cookies on a pale surface',
  },
  letter: {
    unsplashId: '1652283321082-72bb2b601abd',
    alt: 'Hands shaping a ball of dough on a floured bench',
  },
} satisfies Record<string, Photo>;

/* ------------------------------------------------------------------ */
/* Bakes                                                               */
/* ------------------------------------------------------------------ */

export const categories = [
  { id: 'bread', label: 'Bread' },
  { id: 'pastry', label: 'Pastries' },
  { id: 'cake', label: 'Cakes and slices' },
  { id: 'cookie', label: 'Cookies' },
] as const;

export type CategoryId = (typeof categories)[number]['id'];

export type Bake = {
  id: string;
  name: string;
  category: CategoryId;
  /** PLACEHOLDER price in NZD. */
  price: number;
  description: string;
  /** Finishes the line "for dear my ____" on the stamp. */
  dearTo: string;
  photo: Photo;
};

// PLACEHOLDER — sample products, descriptions and prices. Replace with the real menu.
export const bakes: Bake[] = [
  {
    id: 'butter-croissant',
    name: 'Butter Croissant',
    category: 'pastry',
    price: 5.5,
    description: 'Crisp outside, soft and stretchy inside. Best eaten on the walk home.',
    dearTo: 'early bird',
    photo: { unsplashId: '1693483640461-267d788b6148', alt: 'Close-up of freshly baked croissants on a tray' },
  },
  {
    id: 'pain-au-chocolat',
    name: 'Pain au Chocolat',
    category: 'pastry',
    price: 6.5,
    description: 'Flaky layers wrapped around two sticks of dark chocolate.',
    dearTo: 'sweet tooth',
    photo: { unsplashId: '1778399980486-5262c74e5f2c', alt: 'Golden pastries filled with dark chocolate' },
  },
  {
    id: 'cinnamon-swirl',
    name: 'Cinnamon Swirl',
    category: 'pastry',
    price: 6.5,
    description: 'Soft, sticky and wound up tight with brown sugar and cinnamon.',
    dearTo: 'cosy one',
    photo: { unsplashId: '1593872571314-4a735d4b27b0', alt: 'A glazed cinnamon roll on a wooden board' },
  },
  {
    id: 'sunday-sourdough',
    name: 'Sunday Sourdough',
    category: 'bread',
    price: 11,
    description: 'Slow-fermented loaf with a crackly crust and a chewy middle.',
    dearTo: 'whole flat',
    photo: { unsplashId: '1616841888027-89693dec0827', alt: 'A round sourdough loaf resting on white cloth' },
  },
  {
    id: 'toastie-loaf',
    name: 'Toastie Loaf',
    category: 'bread',
    price: 9.5,
    description: 'Sliced thick for toast, toasties and anything involving butter.',
    dearTo: 'lunchbox packer',
    photo: { unsplashId: '1620921592619-652411a0d01a', alt: 'Thick slices of bread on a wooden tray' },
  },
  {
    id: 'strawberry-cream-cake',
    name: 'Strawberry Cream Cake',
    category: 'cake',
    price: 9,
    description: 'Light sponge, whipped cream and fresh strawberries, by the slice.',
    dearTo: 'birthday human',
    photo: { unsplashId: '1627308595171-d1b5d67129c4', alt: 'Slices of strawberry and cream layer cake' },
  },
  {
    id: 'burnt-cheesecake',
    name: 'Burnt Basque Cheesecake',
    category: 'cake',
    price: 9.5,
    description: 'Dark caramelised top, creamy custardy centre. No base, no fuss.',
    dearTo: 'fancy friend',
    photo: { unsplashId: '1638519651608-412009302a02', alt: 'A burnt Basque cheesecake with a slice cut out' },
  },
  {
    id: 'fudge-brownie',
    name: 'Fudge Brownie',
    category: 'cake',
    price: 6,
    description: 'Dense, dark and squidgy, with a shiny crackled top.',
    dearTo: 'chocolate fiend',
    photo: { unsplashId: '1636743715220-d8f8dd900b87', alt: 'A stack of chocolate brownies' },
  },
  {
    id: 'choc-chip-cookie',
    name: 'Brown Butter Choc Chip',
    category: 'cookie',
    price: 5,
    description: 'Big, chewy cookie with puddles of chocolate and a pinch of salt.',
    dearTo: 'study buddy',
    photo: { unsplashId: '1634188023615-7e08901193b6', alt: 'Chocolate chip cookies on a pale surface' },
  },
  {
    id: 'matcha-cookie',
    name: 'Matcha White Choc',
    category: 'cookie',
    price: 5.5,
    description: 'Earthy green tea cookie dotted with sweet white chocolate.',
    dearTo: 'tea drinker',
    photo: { unsplashId: '1757345016219-7b3b8a1b9fba', alt: 'A green matcha cookie with white chocolate chips' },
  },
  {
    id: 'dear-heart-shortbread',
    name: 'Dear Heart Shortbread',
    category: 'cookie',
    price: 4.5,
    description: 'Buttery heart-shaped shortbread with pink icing. Says it for you.',
    dearTo: 'crush',
    photo: { unsplashId: '1698948152945-fe2ef83b0975', alt: 'Heart-shaped biscuits with pink icing and sprinkles' },
  },
];

/* ------------------------------------------------------------------ */
/* SEO                                                                 */
/* ------------------------------------------------------------------ */

export const seo = {
  title: 'DearMy Bakeshop | Bakery in the Boxed Quarter, Christchurch',
  description:
    'DearMy Bakeshop is an independent bakery at 181 Madras Street, Christchurch. Bread, pastries, cakes and cookies baked for someone dear. Order by Instagram message or phone.',
};

export const formatPrice = (n: number) => `$${n.toFixed(2)}`;
