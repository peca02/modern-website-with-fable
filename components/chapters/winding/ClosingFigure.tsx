import { WINDING } from "@/lib/content";

const { value, unit, caption } = WINDING.closing;
const split = value.lastIndexOf(",") + 1;
const cold = WINDING.layers[WINDING.layers.length - 1];
const hot = WINDING.layers[0];

/**
 * The punchline. The last three digits are the cold side of the sum, so they
 * take the cryo tone; the rule underneath runs from the cryostat to the plasma.
 */
export function ClosingFigure() {
  return (
    <div className="col-span-full mt-24 lg:col-span-5 in-data-pinned:pointer-events-none in-data-pinned:absolute in-data-pinned:inset-0 in-data-pinned:mt-0 in-data-pinned:grid-page in-data-pinned:items-start in-data-pinned:pt-28 lg:in-data-pinned:items-end lg:in-data-pinned:pb-10 lg:in-data-pinned:pt-0">
      <div className="text-shade col-span-full flex flex-col gap-4 lg:col-span-6 lg:col-start-7">
        <p className="type-counter flex items-start overflow-hidden pb-2 text-display">
          <span data-closing-figure className="block">
            {value.slice(0, split)}
            <span data-closing-cold className="text-cryo">
              {value.slice(split)}
            </span>
          </span>
          <span data-closing-fade className="type-micro ml-2 text-ash">
            {unit}
          </span>
        </p>
        <div aria-hidden="true" className="flex flex-col gap-2">
          <span data-closing-rule className="block h-px origin-left bg-linear-to-r from-cryo to-plasma" />
          <p data-closing-fade className="type-micro flex justify-between gap-4">
            <span className="text-cryo">
              {cold.name} {cold.spec}
            </span>
            <span className="text-right text-plasma">
              {hot.name} {hot.spec}
            </span>
          </p>
        </div>
        <p data-closing-fade className="type-body max-w-prose text-ash">
          {caption}
        </p>
      </div>
    </div>
  );
}
