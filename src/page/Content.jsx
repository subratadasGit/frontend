import Card from "../components/Card";
import { ListIcon, WriteIcon } from "../components/Icon";

const contentFeatures = [
  {
    id: "rewrite",
    link: "/content/rewrite",
    title: "Rewrite Content",
    description: "Rewrite your content with AI",
    icon: <WriteIcon style="w-6 h-6 text-blue-600" />,
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    id: "expand",
    link: "/content/expand",
    title: "Expand content",
    description: "Make your content more detailed with AI",
    icon: <WriteIcon style="w-6 h-6 text-indigo-600" />,
    gradient: "from-indigo-600 to-purple-600",
  },
  {
    id: "shorten",
    link: "/content/shorten",
    title: "Shorten Content",
    description: "Make your content more concise with AI",
    icon: <WriteIcon style="w-6 h-6 text-orange-600" />,
    gradient: "from-orange-600 to-stone-400",
  },
  {
    id: "seo-content",
    link: "/content/seo-content",
    title: "SEO content",
    description:
      "Automatically generate SEO title, keyword, and meta description",
    icon: <ListIcon style="w-6 h-6 text-cyan-600" />,
    gradient: "from-cyan-500 to-pink-500",
  },
  {
    id: "generate-article",
    link: "/content/generate-article",
    title: "Generate Article",
    description: "Create a new article with AI",
    icon: <WriteIcon style="w-6 h-6 text-green-600" />,
    gradient: "from-green-600 to-cyan-600",
  },
  {
    id: "history",
    link: "/content/history",
    title: "Content history",
    description: "View and manage all your generated content",
    icon: <ListIcon style="w-6 h-6 text-purple-600" />,
    gradient: "from-purple-500 to-pink-500",
  },
];

export default function Content() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Content Management
          </h1>
          <p className="text-gray-600 text-lg">
            {/* add more content if needed */}
            Transform and manage your content with AI-powered tools
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {contentFeatures.map((feature) => (
            <Card key={feature.id} feature={feature} />
          ))}
        </div>
        <div className="mt-12 border p-8 rounded-2xl shadow-xl border-gray-300">
          <h2 className="text-2xl font-bold">About content Tools</h2>
          <p className="text-gray-600 mt-2">
            Our content management suite provides powerful AI-driven tools to
            help you create, edit, and optimize your content. Whether you need
            to rewrite text, shorten lengthy articles, or expand brief content,
            we have the tools to help you achieve your goals.
          </p>
        </div>
      </div>
    </div>
  );
}