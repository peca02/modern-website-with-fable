import { WINDING } from "@/lib/content";
import { layerIndexLabel } from "./layers";

/** Staggered stem heights keep neighbouring call-outs from landing on one line. */
const STEMS = ["h-10", "h-24", "h-12", "h-20", "h-14", "h-16"] as const;

/**
 * Call-outs pinned to the scene's screen-space anchors. Decorative: the same
 * names and specs are in the layer list. Phones get the dot and index only.
 */
export function LayerLabels() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden in-data-pinned:block">
      {WINDING.layers.map((layer, index) => (
        <div
          key={layer.name}
          data-label
          data-active="false"
          data-flip="false"
          className="group absolute left-0 top-0 text-ash transition-colors duration-300 ease-reveal will-change-transform data-[active=true]:text-bone"
        >
          <span
            data-label-dot
            className="absolute -left-1 -top-1 block size-2 rounded-full border border-current bg-void transition-colors duration-300 ease-reveal group-data-[active=true]:border-plasma group-data-[active=true]:bg-plasma"
          />
          <span
            data-label-index
            className="type-micro absolute -top-2 left-3 transition-colors duration-300 ease-reveal group-data-[active=true]:text-plasma lg:group-data-[active=true]:hidden"
          >
            {layerIndexLabel(index)}
          </span>
          <span
            className={`absolute bottom-1 left-0 hidden w-px opacity-0 transition-opacity duration-300 ease-reveal group-data-[active=true]:opacity-100 lg:block ${STEMS[index]}`}
          >
            <span data-label-stem className="absolute inset-0 origin-bottom bg-current opacity-60" />
            <span className="absolute left-0 top-0 -mt-2 flex items-start gap-3 group-data-[flip=true]:left-auto group-data-[flip=true]:right-0 group-data-[flip=true]:flex-row-reverse group-data-[flip=true]:text-right">
              <span
                data-label-arm
                className="mt-2 block h-px w-8 shrink-0 origin-left bg-current opacity-60 group-data-[flip=true]:origin-right"
              />
              <span className="type-micro flex flex-col whitespace-nowrap">
                <span className="block overflow-hidden">
                  <span data-label-text className="block">
                    <span className="mr-2 text-ash transition-colors duration-300 ease-reveal group-data-[active=true]:text-plasma">
                      {layerIndexLabel(index)}
                    </span>
                    {layer.name}
                  </span>
                </span>
                <span className="block overflow-hidden">
                  <span
                    data-label-text
                    className={`block text-ash transition-colors duration-300 ease-reveal ${index >= 4 ? "group-data-[active=true]:text-cryo" : ""}`}
                  >
                    {layer.spec}
                  </span>
                </span>
              </span>
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
