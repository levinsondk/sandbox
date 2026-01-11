"use client";

import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ButtonGroup } from "@/components/ui/button-group";
import { Plus, Minus } from "lucide-react";
import "./page.css";

function MoreText() {
  return (
    <div>
      <p>
        The perfect taco is not just food—it's a carefully orchestrated symphony
        of textures, flavors, and the quiet satisfaction of holding something
        beautiful that's about to fall apart in your hands. Every bite should
        tell a story: crispy, then soft, then tangy, then heat. If your taco
        doesn't make you close your eyes mid-chew, you're doing it wrong and
        should immediately start over with more cheese.
      </p>

      <ol>
        <li>
          Master the tortilla. (This is non-negotiable.) A great taco lives and
          dies by its foundation, and store-bought is acceptable only if you
          warm it properly—dry pan, medium heat, fifteen seconds per side, and a
          light char if you're feeling brave.
          <ol>
            <li>
              If you're making tortillas from scratch, use masa harina, warm
              water, and a pinch of salt. Press them thin but not too thin, cook
              until brown spots appear, and stack them under a towel to stay
              soft. This is where champions are made.
            </li>
            <li>
              Flour tortillas work too, especially for larger tacos or breakfast
              variations. The key is to get them pliable enough to fold without
              cracking—nobody wants a taco that shatters like a betrayal at
              first bite.
            </li>
            <li>
              Double up the tortillas if you're loading heavy. There's nothing
              sadder than a structural failure mid-taco, and a second layer
              provides insurance against juice, grease, and the general chaos of
              a well-built bite.
            </li>
          </ol>
        </li>
        <li>
          Season your protein like you mean it. Whether it's carne asada,
          carnitas, or grilled fish, the meat should be seasoned aggressively
          with cumin, chili powder, garlic, and lime. Underseasoned protein is a
          crime against tacos, punishable by having to eat sad food you made
          yourself.
        </li>
        <li>
          Build with intention. Start with protein, add your crunch (cabbage,
          radish, onion), then drizzle your sauce, and finish with fresh
          cilantro and a squeeze of lime. The order matters—sauce under toppings
          slides off, and cilantro buried beneath cheese is a waste of
          everyone's time.
        </li>
      </ol>

      <p>
        For the love of all things delicious: do not skip the acid. A taco
        without lime is like a joke without a punchline—technically complete,
        but missing the thing that makes it worth telling. That bright squeeze
        at the end lifts every other flavor and cuts through the richness like a
        ray of citrus sunshine directly into your mouth.
      </p>

      <ul>
        <li>
          Essential toppings to keep on hand:
          <ul>
            <li>
              Pickled red onions—they take five minutes to make and last for
              weeks in your fridge. Slice thin, douse in lime juice and a pinch
              of salt, and let them sit while you cook everything else. The pink
              color alone is worth it.
            </li>
            <li>
              A good salsa verde made from roasted tomatillos, serranos, garlic,
              and cilantro. It should be bright, tangy, and just spicy enough to
              make you reach for your drink but not so hot that you can't taste
              anything else.
            </li>
            <li>
              Crema or sour cream thinned with lime juice. This provides the
              cooling contrast that balances heat and lets you go harder on the
              hot sauce without regret. Drizzle in zigzags for maximum coverage
              and visual drama.
            </li>
          </ul>
        </li>
        <li>
          Fresh cilantro is not optional. If you have the gene that makes
          cilantro taste like soap, you have my sympathy, but the rest of us
          cannot imagine a taco without that bright, herby punch. Use the leaves
          and the tender stems—don't waste the good stuff.
        </li>
        <li>
          Cotija cheese crumbled on top adds salty, funky depth that melty
          cheeses simply cannot provide. It doesn't melt, it seasons—each bite
          gets a little hit of aged dairy glory that makes everything around it
          taste more like itself.
        </li>
      </ul>

      <p>
        Now go forth and build tacos that would make a street vendor nod in
        quiet approval. Remember: the best taco is the one you're eating right
        now, with your hands, over a plate because things will drip, and that's
        exactly how it should be. Perfection is messy. Embrace the chaos.
      </p>
    </div>
  );
}

function FewerText() {
  return (
    <>
      <p>
        A great taco is simple: warm tortilla, well-seasoned protein, fresh
        toppings, and a squeeze of lime. That's it. Don't overthink it.
      </p>

      <ol>
        <li>
          Get your tortilla right.
          <ol>
            <li>Warm it in a dry pan until pliable.</li>
            <li>Double up for structural integrity.</li>
            <li>Never microwave—that's just sad.</li>
          </ol>
        </li>
        <li>Season your meat aggressively.</li>
        <li>Build smart—protein, crunch, sauce, cilantro, lime.</li>
      </ol>

      <p>
        The secret is acid. Lime juice ties everything together and makes each
        bite sing.
      </p>

      <ul>
        <li>
          Essential toppings:
          <ul>
            <li>Pickled red onions.</li>
            <li>Fresh salsa verde.</li>
            <li>Crema thinned with lime.</li>
          </ul>
        </li>
        <li>Cilantro is not optional.</li>
        <li>Cotija cheese for salty, crumbly goodness.</li>
      </ul>

      <p>Now go make tacos. Messy hands, happy heart.</p>
    </>
  );
}

export default function ListStylePage() {
  const [fontSize, setFontSize] = useState(16);
  const [textAmount, setTextAmount] = useState<"fewer" | "more">("more");

  return (
    <>
      <div className="flex flex-col mx-auto gap-4 sm:gap-8 max-w-[640px]">
        <div className="sticky top-0 sm:top-4 z-50 bg-background/80 backdrop-blur-sm border-b-[0.5px] sm:border-[0.5px] drop-shadow-xs sm:rounded-xl px-4 py-3">
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <div className="flex flex-wrap gap-x-6 gap-y-3 mr-auto">
              <div className="flex items-center gap-3">
                <Label className="text-sm whitespace-nowrap">
                  Size: <span className="tabular-nums">{fontSize}</span>px
                </Label>
                <ButtonGroup>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setFontSize(Math.max(14, fontSize - 1))}
                    disabled={fontSize <= 14}
                  >
                    <Minus />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setFontSize(Math.min(24, fontSize + 1))}
                    disabled={fontSize >= 24}
                  >
                    <Plus />
                  </Button>
                </ButtonGroup>
              </div>
              <div className="flex irems-center gap-3">
                <Label className="text-sm">Text amount</Label>
                <ToggleGroup
                  type="single"
                  value={textAmount}
                  onValueChange={(val) => {
                    if (val) setTextAmount(val as "fewer" | "more");
                  }}
                  variant="outline"
                >
                  <ToggleGroupItem value="more" aria-label="More text">
                    More
                  </ToggleGroupItem>
                  <ToggleGroupItem value="fewer" aria-label="Fewer text">
                    Fewer
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <Button asChild>
              <a
                href="https://github.com/levinsondk/share-sandbox/blob/main/src/app/list-style/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/github-mark-white.svg" alt="" className="size-4" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
        <div className="px-4 mb-16" style={{ fontSize: `${fontSize}px` }}>
          {textAmount === "fewer" ? <FewerText /> : <MoreText />}
        </div>
      </div>
    </>
  );
}
