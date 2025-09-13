import HomePagePosts from "@/components/HomePagePosts";

export default function HomePage() {
  return (
    <>
      <div className=" pt-20">
        { }
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Welcome to Solana Instagram</h1>
          <p className="text-muted-foreground mb-6">
            Share your moments on the blockchain. Create posts, connect with others, and explore the decentralized social experience.
          </p>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <HomePagePosts />
      </div>
    </>
  );
}