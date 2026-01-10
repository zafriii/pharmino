// import { calculateTabletPrice, calculateAvailableTablets, calculateStripImpact } from '../tablet-calculation.utils';

// describe('Tablet Calculation Utils', () => {
//   describe('calculateTabletPrice', () => {
//     it('should calculate price for tablet sales correctly', () => {
//       const product = {
//         pricePerUnit: 2.5,
//         sellingPrice: 25,
//         tabletsPerStrip: 10
//       };

//       const result = calculateTabletPrice(product, 3, 'SINGLE_TABLET');

//       expect(result.isTabletSale).toBe(true);
//       expect(result.unitPrice).toBe(2.5);
//       expect(result.totalPrice).toBe(7.5);
//       expect(result.tabletsRequested).toBe(3);
//     });

//     it('should calculate price for strip sales correctly', () => {
//       const product = {
//         pricePerUnit: 2.5,
//         sellingPrice: 25,
//         tabletsPerStrip: 10
//       };

//       const result = calculateTabletPrice(product, 2, 'FULL_STRIP');

//       expect(result.isTabletSale).toBe(false);
//       expect(result.unitPrice).toBe(25);
//       expect(result.totalPrice).toBe(50);
//       expect(result.tabletsRequested).toBe(0);
//     });
//   });

//   describe('calculateAvailableTablets', () => {
//     it('should calculate available tablets correctly', () => {
//       const result = calculateAvailableTablets(5, 10);
//       expect(result).toBe(50);
//     });
//   });

//   describe('calculateStripImpact', () => {
//     it('should calculate strip impact for exact strips', () => {
//       const result = calculateStripImpact(20, 10);
      
//       expect(result.stripsAffected).toBe(2);
//       expect(result.completeStripsUsed).toBe(2);
//       expect(result.remainingTabletsInLastStrip).toBe(0);
//     });

//     it('should calculate strip impact for partial strips', () => {
//       const result = calculateStripImpact(23, 10);
      
//       expect(result.stripsAffected).toBe(3);
//       expect(result.completeStripsUsed).toBe(2);
//       expect(result.remainingTabletsInLastStrip).toBe(7);
//     });
//   });
// });