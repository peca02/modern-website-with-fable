import { WINDING } from "@/lib/content";
import { layerIndexLabel, layerSpecTone } from "./layers";

/**
 * The six layers as real content. Pinned: a compact index on desktop with the
 * active layer's detail stacked underneath, a single active block on phones.
 * Inactive details are only faded, so every body stays readable to assistive tech.
 */
export function LayerList() {
  return (
    <div className="text-shade relative lg:w-4/5 lg:in-data-pinned:pb-40">
      <div
        aria-hidden="true"
        className="relative mb-4 hidden h-px w-full bg-rule in-data-pinned:block lg:absolute lg:left-0 lg:top-0 lg:mb-0 lg:h-54 lg:w-px"
      >
        <span data-rail-fill className="absolute inset-0 origin-left bg-rule-strong lg:origin-bottom" />
        <span data-rail-mark className="absolute left-0 top-0 hidden h-9 w-px bg-plasma lg:block" />
      </div>

      <ol className="relative flex flex-col in-data-pinned:grid lg:in-data-pinned:block lg:in-data-pinned:pl-6">
        {WINDING.layers.map((layer, index) => (
          <li
            key={layer.name}
            data-layer
            data-active="false"
            className="group border-t border-rule py-6 in-data-pinned:col-start-1 in-data-pinned:row-start-1 in-data-pinned:border-0 in-data-pinned:py-0"
          >
            <div className="flex items-baseline gap-4 lg:in-data-pinned:h-9 lg:in-data-pinned:items-center">
              <span className="type-micro text-plasma transition-colors duration-300 ease-reveal lg:in-data-pinned:text-ash lg:in-data-pinned:group-data-[active=true]:text-plasma">
                {layerIndexLabel(index)}
              </span>
              <h3 className="type-counter text-title transition-colors duration-300 ease-reveal lg:in-data-pinned:text-lead lg:in-data-pinned:text-ash lg:in-data-pinned:group-data-[active=true]:text-bone">
                {layer.name}
              </h3>
            </div>
            <div
              data-layer-detail
              className="mt-3 flex flex-col gap-2 lg:in-data-pinned:absolute lg:in-data-pinned:inset-x-0 lg:in-data-pinned:top-full lg:in-data-pinned:mt-6 lg:in-data-pinned:pl-24"
            >
              <p className={`type-micro overflow-hidden ${layerSpecTone(index)}`}>
                <span data-layer-spec className="block">
                  {layer.spec}
                </span>
              </p>
              <p data-layer-body className="type-body max-w-prose text-bone">
                {layer.body}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div
        aria-hidden="true"
        className="type-counter absolute left-6 top-60 hidden overflow-hidden text-title text-plasma lg:in-data-pinned:block"
      >
        <span className="invisible block">00</span>
        <span data-layer-roll className="absolute left-0 top-0 flex flex-col">
          {WINDING.layers.map((layer, index) => (
            <span key={layer.name} className="block">
              {layerIndexLabel(index)}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
