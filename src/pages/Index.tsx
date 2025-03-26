
import { ImageManager } from "@/components/ImageManager";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <ImageManager />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
