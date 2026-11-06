
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Image as ImageIcon } from "lucide-react";

export default function VendorPortfolio() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-serif font-bold">Portfolio</h1>
        <Button className="bg-burgundy text-white flex items-center gap-2"><Plus className="h-4 w-4" /> Add Image</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map((i) => (
          <Card key={i}>
            <div className="h-48 rounded-xl bg-muted mb-4 overflow-hidden relative group">
              <ImageIcon className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-black/30 group-hover:opacity-0 transition-opacity flex items-center justify-center">
                <Button variant="ghost" size="sm">View</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

