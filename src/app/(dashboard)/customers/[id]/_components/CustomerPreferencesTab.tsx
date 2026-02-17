'use client'

import { useMemo, useState } from 'react'
import { Heart, Package, Shirt, Palette } from 'lucide-react'
import { FavoritesColorSection } from '@/components/features/FavoritesColorSection'
import { InheritanceToggle } from '@/components/features/InheritanceToggle'
import { InheritanceDetail } from '@/components/features/InheritanceDetail'
import { GarmentMiniCard } from '@/components/features/GarmentMiniCard'
import { cn } from '@shared/lib/cn'
import { resolveEffectiveFavorites, getInheritanceChain } from '@domain/rules/customer.rules'
import { getBrandPreferencesMutable } from '@infra/repositories/settings'
import type { Color } from '@domain/entities/color'
import type { GarmentCatalog } from '@domain/entities/garment'
import type { InheritanceMode } from '@domain/entities/color-preferences'
import type { Customer } from '@domain/entities/customer'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

type CustomerPreferencesTabProps = {
  customer: Customer
  customers: Customer[]
  colors: Color[]
  garmentCatalog: GarmentCatalog[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerPreferencesTab({
  customer,
  customers,
  colors: catalogColors,
  garmentCatalog,
}: CustomerPreferencesTabProps) {
  // Derive available brands from catalog prop
  const availableBrands = useMemo(() => {
    const brands = new Set(garmentCatalog.map((g) => g.brand))
    return Array.from(brands).sort()
  }, [garmentCatalog])
  // Version counter to force re-render after mock data mutations (Phase 1).
  // Will be removed in Phase 3 when real API calls replace in-place mutations.
  const [version, setVersion] = useState(0)
  void version // read to suppress unused warning; referenced in bump calls

  // Derive inherit mode from customer data — single source of truth
  const inheritMode: InheritanceMode = customer.favoriteColors.length > 0 ? 'customize' : 'inherit'

  // Resolve parent label for InheritanceToggle
  const parentLabel =
    customer.favoriteBrandNames.length > 0 ? customer.favoriteBrandNames[0] : 'global'

  // Resolve effective favorites for this customer
  const favoriteIds = resolveEffectiveFavorites(
    'customer',
    customer.id,
    catalogColors,
    customers,
    getBrandPreferencesMutable()
  )
  const favorites = favoriteIds
    .map((id) => catalogColors.find((c) => c.id === id))
    .filter((c): c is Color => c != null)

  // Get inheritance chain for the detail disclosure
  const chain = getInheritanceChain(
    'customer',
    customer.id,
    catalogColors,
    customers,
    getBrandPreferencesMutable()
  )

  // Garment lists
  const favGarmentSet = new Set(customer.favoriteGarments)
  const favoriteGarments = garmentCatalog.filter((g) => favGarmentSet.has(g.id))
  const nonFavoriteGarments = garmentCatalog.filter((g) => !favGarmentSet.has(g.id))

  // -------------------------------------------------------------------------
  // N12: setCustomerInheritMode
  // -------------------------------------------------------------------------

  function handleInheritModeChange(mode: InheritanceMode) {
    const cust = customers.find((c) => c.id === customer.id)
    if (!cust) return

    if (mode === 'inherit') {
      cust.favoriteColors = []
    } else {
      const effective = resolveEffectiveFavorites(
        'customer',
        customer.id,
        catalogColors,
        customers,
        getBrandPreferencesMutable()
      )
      cust.favoriteColors = [...effective]
    }
    setVersion((v) => v + 1)
  }

  // -------------------------------------------------------------------------
  // N13: toggleCustomerColorFavorite
  // -------------------------------------------------------------------------

  function handleToggleColor(colorId: string) {
    const cust = customers.find((c) => c.id === customer.id)
    if (!cust) return

    const idx = cust.favoriteColors.indexOf(colorId)
    if (idx >= 0) {
      cust.favoriteColors.splice(idx, 1)
    } else {
      cust.favoriteColors.push(colorId)
    }
    setVersion((v) => v + 1)
  }

  // -------------------------------------------------------------------------
  // N14: toggleCustomerBrandFavorite
  // -------------------------------------------------------------------------

  function handleToggleBrand(brandName: string) {
    const cust = customers.find((c) => c.id === customer.id)
    if (!cust) return

    const idx = cust.favoriteBrandNames.indexOf(brandName)
    if (idx >= 0) {
      cust.favoriteBrandNames.splice(idx, 1)
    } else {
      cust.favoriteBrandNames.push(brandName)
    }
    setVersion((v) => v + 1)
  }

  // -------------------------------------------------------------------------
  // N15: toggleCustomerGarmentFavorite
  // -------------------------------------------------------------------------

  function handleToggleGarment(garmentId: string) {
    const cust = customers.find((c) => c.id === customer.id)
    if (!cust) return

    const idx = cust.favoriteGarments.indexOf(garmentId)
    if (idx >= 0) {
      cust.favoriteGarments.splice(idx, 1)
    } else {
      cust.favoriteGarments.push(garmentId)
    }
    setVersion((v) => v + 1)
  }

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------------- */}
      {/* Color Preferences (U51-U55) */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Palette size={16} className="text-action" aria-hidden="true" />
          Color Preferences
        </h3>

        {/* U52: InheritanceToggle */}
        <div className="mb-4">
          <InheritanceToggle
            parentLabel={parentLabel}
            mode={inheritMode}
            onChange={handleInheritModeChange}
          />
        </div>

        {/* U53/U54: FavoritesColorSection */}
        <FavoritesColorSection
          favorites={favorites}
          allColors={catalogColors}
          onToggle={handleToggleColor}
          readOnly={inheritMode === 'inherit'}
        />

        {/* U55: InheritanceDetail */}
        <div className="mt-3">
          <InheritanceDetail chain={chain} />
        </div>
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Favorite Brands (U56-U57) */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Package size={16} className="text-action" aria-hidden="true" />
          Favorite Brands
        </h3>

        {availableBrands.length === 0 ? (
          <p className="text-sm text-muted-foreground">No brands available in catalog.</p>
        ) : (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Brand favorites">
            {availableBrands.map((brand) => {
              const isFav = customer.favoriteBrandNames.includes(brand)
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleToggleBrand(brand)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
                    'min-h-(--mobile-touch-target) md:min-h-0',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'motion-reduce:transition-none',
                    isFav
                      ? 'border-action bg-action/10 text-action'
                      : 'border-border bg-elevated text-muted-foreground hover:text-foreground hover:border-foreground/30'
                  )}
                  aria-pressed={isFav}
                >
                  {isFav && <Heart size={12} className="fill-current" aria-hidden="true" />}
                  {brand}
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Favorite Garments (U58-U59) */}
      {/* ----------------------------------------------------------------- */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Shirt size={16} className="text-action" aria-hidden="true" />
          Favorite Garments
        </h3>

        {favoriteGarments.length === 0 && nonFavoriteGarments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No garments in catalog.</p>
        ) : (
          <div className="space-y-4">
            {/* Current favorites */}
            {favoriteGarments.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">No favorite garments set.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {favoriteGarments.map((garment) => (
                  <GarmentMiniCard
                    key={garment.id}
                    garment={garment}
                    variant="favorite"
                    isFavorite={true}
                    onClick={() => handleToggleGarment(garment.id)}
                  />
                ))}
              </div>
            )}

            {/* All garments (non-favorites) */}
            {nonFavoriteGarments.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">All Garments</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {nonFavoriteGarments.map((garment) => (
                    <GarmentMiniCard
                      key={garment.id}
                      garment={garment}
                      variant="favorite"
                      isFavorite={false}
                      onClick={() => handleToggleGarment(garment.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
