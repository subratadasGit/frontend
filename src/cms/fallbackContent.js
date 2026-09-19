/**
 * GENERATED FILE — do not edit by hand.
 *
 * Mirrors the backend CMS seed (`backend/cms/defaults.js`) so the landing page
 * still renders when the API is unreachable. Regenerate with:
 *
 *   npm run sync:fallback
 */

export const FALLBACK_CONTENT = {
  "settings": {
    "siteName": "creates.io",
    "logo": "/favicon.svg",
    "favicon": "/favicon.svg",
    "primaryColor": "#FF4D1C",
    "secondaryColor": "#7C3AED",
    "socialLinks": [
      {
        "platform": "X",
        "url": "https://x.com",
        "icon": "x"
      },
      {
        "platform": "GitHub",
        "url": "https://github.com",
        "icon": "github"
      },
      {
        "platform": "LinkedIn",
        "url": "https://linkedin.com",
        "icon": "linkedin"
      }
    ],
    "contactInformation": {
      "email": "hello@creates.io",
      "phone": "+1 (415) 555-0142",
      "address": "Remote-first"
    }
  },
  "hero": {
    "eyebrow": "Content · Images · Managed",
    "title": "CONTENT\nWITHOUT\nLIMITS.",
    "description": "creates.io turns a prompt into publish-ready work. Rewrite, expand, shorten, draft full articles, generate SEO metadata, and produce original images — then manage every version in one workspace.",
    "primaryCTA": {
      "label": "Start Creating",
      "url": "/register"
    },
    "secondaryCTA": {
      "label": "See Capabilities",
      "url": "#features"
    },
    "heroImage": "",
    "enabled": true
  },
  "footer": {
    "description": "An AI-assisted content management system: generate, refine, illustrate, and keep every version in one workspace.",
    "links": [
      {
        "label": "Capabilities",
        "url": "#features"
      },
      {
        "label": "Workflows",
        "url": "#collections"
      },
      {
        "label": "Technology",
        "url": "#technology"
      },
      {
        "label": "About",
        "url": "#about"
      },
      {
        "label": "Sign In",
        "url": "/login"
      },
      {
        "label": "Create Account",
        "url": "/register"
      }
    ],
    "socialLinks": [
      {
        "platform": "X",
        "url": "https://x.com",
        "icon": "x"
      },
      {
        "platform": "GitHub",
        "url": "https://github.com",
        "icon": "github"
      },
      {
        "platform": "LinkedIn",
        "url": "https://linkedin.com",
        "icon": "linkedin"
      }
    ],
    "copyright": "© 2026 creates.io. All rights reserved."
  },
  "seo": {
    "metaTitle": "creates.io — AI Content and Image Generation",
    "metaDescription": "creates.io turns a prompt into publish-ready work: rewrite, expand, shorten, draft articles, generate SEO metadata and original images, and manage every version in one workspace.",
    "keywords": [
      "ai content generator",
      "content management system",
      "ai image generation",
      "seo metadata generator",
      "article writer",
      "content rewriting"
    ],
    "ogTitle": "creates.io — AI Content and Image Generation",
    "ogDescription": "Rewrite, expand, draft, optimise and illustrate your content — then manage every version in one workspace.",
    "ogImage": "",
    "canonicalUrl": "",
    "robots": "index, follow"
  },
  "navigation": [
    {
      "label": "Home",
      "url": "#top",
      "order": 1,
      "visible": true
    },
    {
      "label": "Capabilities",
      "url": "#features",
      "order": 2,
      "visible": true
    },
    {
      "label": "Workflows",
      "url": "#collections",
      "order": 3,
      "visible": true
    },
    {
      "label": "Technology",
      "url": "#technology",
      "order": 4,
      "visible": true
    },
    {
      "label": "About",
      "url": "#about",
      "order": 5,
      "visible": true
    }
  ],
  "sections": [
    {
      "type": "marquee",
      "title": "Rewrite · Expand · Shorten · Articles · SEO · Images",
      "subtitle": "",
      "description": "",
      "content": {
        "items": [
          "REWRITE",
          "EXPAND",
          "SHORTEN",
          "ARTICLES",
          "SEO",
          "IMAGES"
        ]
      },
      "enabled": true,
      "order": 1
    },
    {
      "type": "statement",
      "title": "NOT JUST\nGENERATED.",
      "subtitle": "",
      "description": "Most tools hand you a block of text and walk away. creates.io keeps the whole lifecycle — the prompt, every revision, the images, and the metadata — in one place you can come back to.",
      "content": {
        "lines": [
          {
            "text": "EDITED.",
            "accent": true
          },
          {
            "text": "OPTIMIZED.",
            "accent": false
          },
          {
            "text": "ILLUSTRATED.",
            "accent": true
          },
          {
            "text": "MANAGED.",
            "accent": false
          }
        ]
      },
      "enabled": true,
      "order": 2
    },
    {
      "type": "about",
      "title": "One workspace for everything you publish.",
      "subtitle": "About",
      "description": "Paste a draft and reshape it, or start from a single topic line and generate the article, the SEO metadata, and the artwork to go with it. Every generation is saved against your account, searchable, and ready to re-open — so the work you produced last month is still there next quarter.",
      "content": {
        "stats": [
          {
            "value": "5",
            "label": "Content actions"
          },
          {
            "value": "6",
            "label": "Image presets"
          },
          {
            "value": "1",
            "label": "Unified history"
          },
          {
            "value": "JWT",
            "label": "Secured access"
          }
        ]
      },
      "enabled": true,
      "order": 3
    },
    {
      "type": "features",
      "title": "Three things this does properly.",
      "subtitle": "Capabilities",
      "description": "",
      "content": null,
      "enabled": true,
      "order": 4
    },
    {
      "type": "collections",
      "title": "Workflows you can run today.",
      "subtitle": "Workflows",
      "description": "",
      "content": null,
      "enabled": true,
      "order": 5
    },
    {
      "type": "technology",
      "title": "Built on a production stack.",
      "subtitle": "Technology",
      "description": "No black boxes. Here is exactly what generates your content, where your images live, and what keeps your workspace private.",
      "content": {
        "items": [
          {
            "label": "Text",
            "value": "Google Gemini",
            "detail": "Rewrites, expansions, condensing, long-form articles, and SEO metadata are generated through the Gemini API."
          },
          {
            "label": "Imaging",
            "value": "Hugging Face inference",
            "detail": "Text-to-image generation at six preset resolutions, from 512×512 squares through 1024×768 landscapes."
          },
          {
            "label": "Delivery",
            "value": "Cloudinary CDN",
            "detail": "Generated images are uploaded once and served from a global media CDN, so nothing is lost on refresh."
          },
          {
            "label": "Platform",
            "value": "React 19 · Express · MongoDB",
            "detail": "A JWT-secured API with rate limiting, Redis caching where it helps, and a document store built for content history."
          }
        ]
      },
      "enabled": true,
      "order": 6
    },
    {
      "type": "proof",
      "title": "Teams shipping more, with the same headcount.",
      "subtitle": "Proof",
      "description": "",
      "content": null,
      "enabled": true,
      "order": 7
    },
    {
      "type": "cta",
      "title": "Start creating.",
      "subtitle": "",
      "description": "Create an account and generate your first article, rewrite, or image in under a minute.",
      "content": {
        "primaryCTA": {
          "label": "Create Account",
          "url": "/register"
        },
        "secondaryCTA": {
          "label": "Sign In",
          "url": "/login"
        }
      },
      "enabled": true,
      "order": 8
    }
  ],
  "features": [
    {
      "title": "Content Studio",
      "description": "Rewrite for clarity, expand an outline into a full draft, or condense long copy without losing the point — five distinct actions over one editor.",
      "icon": "pen",
      "order": 1,
      "enabled": true
    },
    {
      "title": "Image Generation",
      "description": "Describe what you need and get original artwork back at six preset resolutions, uploaded to a CDN and attached to your library automatically.",
      "icon": "spark",
      "order": 2,
      "enabled": true
    },
    {
      "title": "Publish Ready",
      "description": "Generate SEO titles, keywords, and meta descriptions from any article — and keep every version searchable in your history.",
      "icon": "shield",
      "order": 3,
      "enabled": true
    }
  ],
  "collections": [
    {
      "title": "Long-form Articles",
      "slug": "long-form-articles",
      "description": "Give it a topic line and get back a structured, publish-ready article with a natural voice and no filler.",
      "image": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
      "category": "Writing",
      "featured": true,
      "status": "published",
      "order": 1,
      "enabled": true
    },
    {
      "title": "Rewrites",
      "slug": "rewrites",
      "description": "Improve clarity, grammar, and tone while keeping the original meaning fully intact.",
      "image": "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?auto=format&fit=crop&w=1200&q=80",
      "category": "Writing",
      "featured": false,
      "status": "published",
      "order": 2,
      "enabled": true
    },
    {
      "title": "SEO Packages",
      "slug": "seo-packages",
      "description": "Titles, keywords, and meta descriptions generated straight from your article — ready to paste into any CMS.",
      "image": "https://images.unsplash.com/photo-1562577309-4932fdd64cd1?auto=format&fit=crop&w=1200&q=80",
      "category": "SEO",
      "featured": false,
      "status": "published",
      "order": 3,
      "enabled": true
    },
    {
      "title": "Original Imagery",
      "slug": "original-imagery",
      "description": "Text-to-image generation at six preset sizes, stored on Cloudinary and downloadable in a click.",
      "image": "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1200&q=80",
      "category": "Imaging",
      "featured": true,
      "status": "published",
      "order": 4,
      "enabled": true
    },
    {
      "title": "Expansions",
      "slug": "expansions",
      "description": "Turn a rough outline or a few bullet points into a fully developed draft with relevant detail.",
      "image": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
      "category": "Writing",
      "featured": false,
      "status": "published",
      "order": 5,
      "enabled": true
    },
    {
      "title": "Summaries",
      "slug": "summaries",
      "description": "Compress long reports and transcripts down to the core argument, without the padding.",
      "image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
      "category": "Writing",
      "featured": false,
      "status": "published",
      "order": 6,
      "enabled": true
    }
  ],
  "testimonials": [
    {
      "name": "Ava Lindqvist",
      "role": "Content Lead",
      "company": "Northwind",
      "avatar": "",
      "quote": "We went from four posts a month to fourteen with the same team. The rewrite action does most of that work.",
      "order": 1,
      "enabled": true
    },
    {
      "name": "Marcus Oyelaran",
      "role": "Founder",
      "company": "Field Notes Supply",
      "avatar": "",
      "quote": "The SEO generator alone replaced a subscription we were already paying for.",
      "order": 2,
      "enabled": true
    },
    {
      "name": "Rin Takahashi",
      "role": "Marketing Manager",
      "company": "Mono Archive",
      "avatar": "",
      "quote": "Rewrites that actually keep our voice. That was the part I did not expect it to get right.",
      "order": 3,
      "enabled": true
    }
  ]
};

export default FALLBACK_CONTENT;
