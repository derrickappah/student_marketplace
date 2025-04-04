import React from 'react';
import {
  MenuBook as TextbooksIcon,
  Devices as ElectronicsIcon,
  Chair as FurnitureIcon,
  Checkroom as ClothingIcon,
  SportsBasketball as SportsIcon,
  ConfirmationNumber as TicketsIcon,
  Handyman as ServicesIcon,
  Category as CategoryIcon,
  School as SchoolIcon,
  Home as HousingIcon,
  DirectionsCar as TransportationIcon,
  ShoppingBasket as GroceryIcon,
  Restaurant as FoodIcon,
  SportsEsports as GamingIcon,
  Palette as ArtIcon,
  MusicNote as MusicIcon,
  DesignServices as DesignIcon,
  Computer as ComputerIcon,
  Pets as PetsIcon,
  Event as EventsIcon,
  Smartphone as PhoneIcon,
  PhotoCamera as CameraIcon,
  School as TutoringIcon,
  Sell as OtherIcon,
  Science as ScienceIcon,
  Brush as ArtSuppliesIcon,
  LocalActivity as ActivitiesIcon,
  SportsFootball as SportsEquipmentIcon,
  LocalLaundryService as AppliancesIcon,
  Book as BooksIcon,
  VideogameAsset as GamesIcon,
  Countertops as KitchenIcon,
  Earbuds as AudioIcon,
  Storage as StorageIcon,
  FormatPaint as HomeDecorIcon,
  LocalFlorist as PlantsIcon,
  CardGiftcard as GiftIcon,
  ChildCare as BabyIcon,
  Toys as ToysIcon,
  Watch as JewelryIcon,
  SportsSoccer as OutdoorIcon,
  FitnessCenter as FitnessIcon,
  Backpack as BagsIcon,
  CoPresent as MentoringIcon,
  RoomPreferences as DormIcon
} from '@mui/icons-material';

/**
 * Maps category names to appropriate Material-UI icons
 * @param {string} categoryName - The name of the category
 * @returns {JSX.Element} The corresponding icon component
 */
export const getCategoryIcon = (categoryName) => {
  // Handle undefined or null category names
  if (!categoryName) return <CategoryIcon />;
  
  // Normalize category name for comparison
  const normalizedName = categoryName.trim().toLowerCase();
  
  const categoryMap = {
    // Main categories
    'textbooks': <TextbooksIcon />,
    'electronics': <ElectronicsIcon />,
    'furniture': <FurnitureIcon />,
    'clothing': <ClothingIcon />,
    'sports & fitness': <SportsIcon />,
    'sports and fitness': <SportsIcon />,
    'fitness': <FitnessIcon />,
    'tickets': <TicketsIcon />,
    'services': <ServicesIcon />,
    'school supplies': <SchoolIcon />,
    'housing': <HousingIcon />,
    'transportation': <TransportationIcon />,
    'grocery': <GroceryIcon />,
    'food & drinks': <FoodIcon />,
    'food and drinks': <FoodIcon />,
    'gaming': <GamingIcon />,
    'art & crafts': <ArtIcon />,
    'art and crafts': <ArtIcon />,
    'music': <MusicIcon />,
    'design': <DesignIcon />,
    'computers': <ComputerIcon />,
    'pets': <PetsIcon />,
    'events': <EventsIcon />,
    'phones': <PhoneIcon />,
    'cameras': <CameraIcon />,
    'tutoring': <TutoringIcon />,
    
    // Specific subcategories
    'science': <ScienceIcon />,
    'art supplies': <ArtSuppliesIcon />,
    'activities': <ActivitiesIcon />,
    'entertainment': <ActivitiesIcon />,
    'sports equipment': <SportsEquipmentIcon />,
    'appliances': <AppliancesIcon />,
    'books': <BooksIcon />,
    'games': <GamesIcon />,
    'kitchen': <KitchenIcon />,
    'kitchen items': <KitchenIcon />,
    'audio': <AudioIcon />,
    'audio equipment': <AudioIcon />,
    'storage': <StorageIcon />,
    'home decor': <HomeDecorIcon />,
    'plants': <PlantsIcon />,
    'gifts': <GiftIcon />,
    'baby': <BabyIcon />,
    'baby items': <BabyIcon />,
    'toys': <ToysIcon />,
    'jewelry': <JewelryIcon />,
    'watches': <JewelryIcon />,
    'outdoor': <OutdoorIcon />,
    'outdoor equipment': <OutdoorIcon />,
    'bags': <BagsIcon />,
    'backpacks': <BagsIcon />,
    'mentoring': <MentoringIcon />,
    'dorm': <DormIcon />,
    'dorm supplies': <DormIcon />,
    'other': <OtherIcon />
  };

  try {
    // Find the closest matching category
    for (const [key, icon] of Object.entries(categoryMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return icon;
      }
    }
    
    // If no match is found in the keys, try to match words
    for (const word of normalizedName.split(/\s+/)) {
      if (word.length < 3) continue; // Skip short words
      
      for (const [key, icon] of Object.entries(categoryMap)) {
        if (key.includes(word)) {
          return icon;
        }
      }
    }
    
    // Return the mapped icon or a default category icon
    return <CategoryIcon />;
  } catch (error) {
    console.error(`Error getting icon for category "${categoryName}":`, error);
    return <CategoryIcon />;
  }
};

/**
 * Get a color for each category based on its name
 * @param {string} categoryName - The name of the category
 * @returns {string} A hex color code
 */
export const getCategoryColor = (categoryName) => {
  // Handle undefined or null category names
  if (!categoryName) return '#64748B'; // Default slate gray
  
  // Normalize category name for comparison
  const normalizedName = categoryName.trim().toLowerCase();
  
  const colorMap = {
    // Main categories with distinctive colors
    'textbooks': '#2563EB',         // Blue
    'books': '#2563EB',             // Blue
    'electronics': '#7C3AED',       // Violet
    'furniture': '#F59E0B',         // Amber
    'clothing': '#EC4899',          // Pink
    'sports & fitness': '#10B981',  // Emerald
    'sports and fitness': '#10B981',// Emerald
    'fitness': '#10B981',           // Emerald
    'tickets': '#F97316',           // Orange
    'services': '#6366F1',          // Indigo
    'school supplies': '#0EA5E9',   // Sky
    'school': '#0EA5E9',            // Sky
    'housing': '#8B5CF6',           // Purple
    'transportation': '#EF4444',    // Red
    'grocery': '#84CC16',           // Lime
    'food & drinks': '#F43F5E',     // Rose
    'food and drinks': '#F43F5E',   // Rose
    'gaming': '#9333EA',            // Fuchsia
    'games': '#9333EA',             // Fuchsia
    'art & crafts': '#14B8A6',      // Teal
    'art and crafts': '#14B8A6',    // Teal
    'art': '#14B8A6',               // Teal
    'music': '#6D28D9',             // Violet
    'design': '#06B6D4',            // Cyan
    'computers': '#3B82F6',         // Blue
    'pets': '#F97316',              // Orange
    'events': '#A855F7',            // Purple
    'phones': '#3B82F6',            // Blue
    'cameras': '#14B8A6',           // Teal
    'tutoring': '#0EA5E9',          // Sky
    'mentoring': '#0EA5E9',         // Sky
    
    // Specific subcategories
    'science': '#06B6D4',           // Cyan
    'appliances': '#64748B',        // Slate
    'kitchen': '#F59E0B',           // Amber
    'kitchen items': '#F59E0B',     // Amber
    'audio': '#7C3AED',             // Violet
    'audio equipment': '#7C3AED',   // Violet
    'storage': '#64748B',           // Slate
    'home decor': '#EC4899',        // Pink
    'plants': '#22C55E',            // Green
    'gifts': '#F43F5E',             // Rose
    'baby': '#FDA4AF',              // Light pink
    'baby items': '#FDA4AF',        // Light pink
    'toys': '#FB923C',              // Light orange
    'jewelry': '#F59E0B',           // Amber
    'watches': '#F59E0B',           // Amber
    'outdoor': '#10B981',           // Emerald
    'outdoor equipment': '#10B981', // Emerald
    'bags': '#EC4899',              // Pink
    'backpacks': '#EC4899',         // Pink
    'dorm': '#8B5CF6',              // Purple
    'dorm supplies': '#8B5CF6',     // Purple
    'other': '#64748B'              // Slate
  };

  try {
    // Find the closest matching category
    for (const [key, color] of Object.entries(colorMap)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return color;
      }
    }
    
    // If no match is found in the keys, try to match words
    for (const word of normalizedName.split(/\s+/)) {
      if (word.length < 3) continue; // Skip short words
      
      for (const [key, color] of Object.entries(colorMap)) {
        if (key.includes(word)) {
          return color;
        }
      }
    }
    
    return '#64748B'; // Default to slate gray
  } catch (error) {
    console.error(`Error getting color for category "${categoryName}":`, error);
    return '#64748B'; // Default slate gray in case of error
  }
}; 