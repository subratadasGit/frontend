import Card from "../components/Card";
import { ImageIcon, ListIcon } from "../components/Icon";

const imageFeature = [
  {
    id: "generate",
    link: "/image/generate",
    title: "Generate Image",
    description: "Create beautiful images using AI",
    icon: <ImageIcon style="w-6 h-6 text-blue-600" />,
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    id: "history",
    link: "/image/history",
    title: "Image history",
    description: "View and manage all your generated images",
    icon: <ListIcon style="w-6 h-6 text-indigo-600" />,
    gradient: "from-indigo-600 to-purple-600",
  },
];

export default function Image() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Image Management
          </h1>
          <p className="text-gray-600 text-lg">
            Generate, view and manage your images using AI
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {imageFeature.map((feature) => (
            <Card key={feature.id} feature={feature} />
          ))}
        </div>
        <div className="mt-12 border p-8 rounded-2xl shadow-xl border-gray-300">
          <h2 className="text-2xl font-bold">About Image Tools</h2>
          <p className="text-gray-600 mt-2">
            Our image management suite provides powerful AI-driven tools to
            generate and organize your images. Create stunning visuals from text
            descriptions and keep track of all your generated images in one
            convenient location.
          </p>
        </div>
      </div>
    </div>
  );
}