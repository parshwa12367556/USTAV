
import { Link } from "react-router-dom";
import { ROUTES } from "@/constants";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Tag, Gift, Music, Video } from "lucide-react";
import { invitationService } from "@/services/invitation.service";

const categoryIcons: Record<string, any> = { traditional: <Gift className="h-5 w-5" />, modern: <Star className="h-5 w-5" />, luxury: <CrownIcon />, floral: <Gift className="h-5 w-5" />, animated: <Video className="h-5 w-5" />, video: <Video className="h-5 w-5" /> };
function CrownIcon(){return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 10L1.333 7.667A2 2 0 015 5.333V2a1 1 0 011-1h1.667a2 2 0 011.789 1.11L12 5.667l2.889-1.444A2 2 0 0118.333 4H22a1 1 0 011 1v3.333a2 2 0 01-1.667 2.667L20.667 10z"/></svg>;}

export default function Invitations() {
  const [category, setCategory] = useState("");
  const { data: templates } = useQuery({
    queryKey: ["invitationTemplates", category],
    queryFn: () => invitationService.listTemplates({ category }),
  });

  const cats = ["", "traditional", "modern", "minimalist", "luxury", "floral", "royal", "animated", "video", "engagement", "haldi", "mehendi", "wedding", "reception", "birthday", "anniversary"];

  return (
    <div className="flex flex-col">
      <section className="py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-serif font-bold mb-3">Invitation Templates</h1>
          <p className="text-muted-foreground">Beautiful digital invitations for every celebration. Free and premium designs.</p>
        </div>
      </section>
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            <Button onClick={() => setCategory("")} variant={!category ? "secondary" : "outline"} size="sm">All</Button>
            {cats.map((c) => c && (
              <Button key={c} onClick={() => setCategory(c)} variant={category === c ? "secondary" : "outline"} size="sm">{c.charAt(0).toUpperCase() + c.slice(1)}</Button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {(templates || []).map((t) => (
              <Card key={t.id}>
                <div className="h-56 overflow-hidden relative mb-4">
                  <img src={t.previewImage} alt={t.name} className="w-full h-full object-cover" />
                  <Badge className="absolute top-3 left-3">{t.isFree ? "Free" : "Premium"}</Badge>
                  <span className="absolute top-3 right-3 bg-gold text-gold-foreground text-xs font-bold px-2 py-1 rounded">?{t.price}</span>
                </div>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase">{t.category}</span>
                  </div>
                  <h3 className="font-semibold">{t.name}</h3>
                </CardContent>
                <CardFooter className="gap-2">
                  <Link to={"/invitations/" + t.id} className="flex-1 py-2 text-center text-sm font-semibold text-burgundy border border-border rounded-lg">Preview</Link>
                  <Button size="sm" className="flex-1 bg-burgundy text-white">Customize</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}


