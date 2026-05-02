import {
  expandContent,
  generateArticle,
  generateSeoContent,
  rewriteContent,
  shortenContent,
} from "./services/content";

export const IMAGE_RESOLUTION = [
  { value: "512x512", label: "512 x 512 (Square)" },
  { value: "1024x1024", label: "1024 x 1024 (Square)" },
  { value: "512x768", label: "512 x 768 (Portrait)" },
  { value: "768x512", label: "768 x 512 (Landscape)" },
  { value: "1024x768", label: "1024 x 768 (Landscape)" },
  { value: "768x1024", label: "768 x 1024 (Portrait)" },
];

export const DEFAULT_COLOR_TYPE = "default";

export const COLOR_MAP = {
  rewrite: "bg-blue-100 text-blue-700",
  shorten: "bg-green-100 text-green-700",
  lengthen: "bg-purple-100 text-purple-700",
  default: "bg-gray-100 text-gray-700",
};

export const PAGES = {
  rewrite: {
    header: "Rewrite content",
    "sub-header": "Rewrite your content with AI",
    "input-placeholder": "Enter the content you want to rewrite...",
    "loading-text": "Rewriting...",
    "button-content": "Rewrite content",
    "output-header": "Rewritten content",
    "redo-instruction": "Rewrite New",
    "output-subheader": "Your rewritten content will appear here",
    "output-form-action":
      "Fill out the form and click rewrite to generate new content",
    handler: rewriteContent,
  },
  expand: {
    header: "Expand content",
    "sub-header": "Make your content more detailed with AI",
    "input-placeholder": "Enter the content you want to expand...",
    "loading-text": "Expanding...",
    "button-content": "Expand content",
    "output-header": "Expanded content",
    "redo-instruction": "Expand New",
    "output-subheader": "Your expanded content will appear here",
    "output-form-action":
      "Fill out the form and click expand to generate new content",
    handler: expandContent,
  },

  shorten: {
    header: "Shorten content",
    "sub-header": "Make your content more concise with AI",
    "input-placeholder": "Enter the content you want to shorten...",
    "loading-text": "Shortening...",
    "button-content": "Shorten content",
    "output-header": "Shorten content",
    "redo-instruction": "Shorten New",
    "output-subheader": "Your shorten content will appear here",
    "output-form-action":
      "Fill out the form and click shorten to generate new content",
    handler: shortenContent,
  },

  "generate-article": {
    header: "Generate Article",
    "sub-header": "Create a new article with AI",
    "input-placeholder": "Enter the topic for the article...",
    "loading-text": "Generating...",
    "button-content": "Generate Article",
    "output-header": "Generated Article",
    "redo-instruction": "Generate New",
    "output-subheader": "Your article will appear here",
    "output-form-action":
      "Fill out the form and click generate to create new articles",
    handler: generateArticle,
  },
  "seo-content": {
    header: "SEO content generator",
    "sub-header":
      "Automatically generate SEO title, keyword, and meta description",
    "input-placeholder": "Paste your article content here...",
    "loading-text": "Generating SEO content...",
    "button-content": "Generate SEO content",
    "output-header": "SEO content",
    "redo-instruction": "Generate New",
    "output-subheader": "Your SEO content will appear here",
    "output-form-action":
      "Fill out the form and click generate to generate SEO content",
    handler: generateSeoContent,
  },
};