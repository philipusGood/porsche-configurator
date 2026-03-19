import { create } from 'zustand'

export const useCarStore = create((set) => ({
  bodyColor: '#CC2222',
  wheelColor: '#1a1a1a',
  wheelType: 'oem',
  wheelSize: 17,
  liftHeight: 0,
  spoiler: 'stock',
  hasStripe: false,
  stripeColor: '#ffffff',
  hasRoofRack: false,
  hasSafariLights: false,
  hasSkidPlate: false,

  setBodyColor: (v) => set({ bodyColor: v }),
  setWheelColor: (v) => set({ wheelColor: v }),
  setWheelType: (v) => set({ wheelType: v }),
  setWheelSize: (v) => set({ wheelSize: v }),
  setLiftHeight: (v) => set({ liftHeight: v }),
  setSpoiler: (v) => set({ spoiler: v }),
  setHasStripe: (v) => set({ hasStripe: v }),
  setStripeColor: (v) => set({ stripeColor: v }),
  setHasRoofRack: (v) => set({ hasRoofRack: v }),
  setHasSafariLights: (v) => set({ hasSafariLights: v }),
  setHasSkidPlate: (v) => set({ hasSkidPlate: v }),
}))
