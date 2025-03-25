/**
 * Gets the image URL for a Pokémon
 * @param {number} pokemonId - The Pokémon ID (1-151)
 * @returns {string} - The URL to the Pokémon image
 */
export const getPokemonImageUrl = (pokemonId) => {
  if (!pokemonId) return '/assets/placeholder.svg';
  
  try {
    // Convert to number and ensure valid range
    const id = Number(pokemonId);
    
    // Handle invalid IDs
    if (isNaN(id) || id < 1 || id > 151) {
      return '/assets/placeholder.svg';
    }
    
    // Return the local assets path
    return `/assets/pokemon/${id}.jpg`;
  } catch (error) {
    console.error('Error generating Pokemon image URL:', error);
    return '/assets/placeholder.svg';
  }
};

export default getPokemonImageUrl; 