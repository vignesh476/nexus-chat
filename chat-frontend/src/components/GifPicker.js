import React, { useState, useEffect } from 'react';
import { Popover, Box, TextField, IconButton, CircularProgress, Typography, Grid, Alert } from '@mui/material';
import { GiphyFetch } from '@giphy/js-fetch-api';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';

// Using a working demo API key for Giphy
const gf = new GiphyFetch('sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh');

// Fallback GIFs in case API fails
const fallbackGifs = [
  { id: '1', title: 'Happy', images: { fixed_height_small: { url: 'https://media.giphy.com/media/3o7TKz9bX9Z8LxQ8q8/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/3o7TKz9bX9Z8LxQ8q8/giphy.gif', width: 200, height: 150 } } },
  { id: '2', title: 'Sad', images: { fixed_height_small: { url: 'https://media.giphy.com/media/3o7TKz9bX9Z8LxQ8q8/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/3o7TKz9bX9Z8LxQ8q8/giphy.gif', width: 200, height: 150 } } },
  { id: '3', title: 'Love', images: { fixed_height_small: { url: 'https://media.giphy.com/media/3o7TKz9bX9Z8LxQ8q8/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/3o7TKz9bX9Z8LxQ8q8/giphy.gif', width: 200, height: 150 } } },
  { id: '4', title: 'Funny', images: { fixed_height_small: { url: 'https://media.giphy.com/media/3o7TKz9bX9Z8LxQ8q8/giphy.gif' }, fixed_height: { url: 'https://media.giphy.com/media/3o7TKz9bX9Z8LxQ8q8/giphy.gif', width: 200, height: 150 } } },
];

const GifPicker = ({ onGifSelect, onClose, anchorEl, open }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trendingGifs, setTrendingGifs] = useState([]);

  useEffect(() => {
    loadTrendingGifs();
  }, []);

  const loadTrendingGifs = async () => {
    try {
      setLoading(true);
      console.log('Loading trending GIFs...');
      const { data } = await gf.trending({ limit: 20 });
      console.log('Trending GIFs loaded:', data.length);
      setTrendingGifs(data);
      setGifs(data);
    } catch (error) {
      console.error('Error loading trending GIFs:', error);
      console.log('Using fallback GIFs...');
      setTrendingGifs(fallbackGifs);
      setGifs(fallbackGifs);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query) => {
    if (!query.trim()) {
      setGifs(trendingGifs);
      return;
    }

    try {
      setLoading(true);
      console.log('Searching GIFs for:', query);
      const { data } = await gf.search(query, { limit: 20 });
      console.log('Search results:', data.length);
      setGifs(data.length > 0 ? data : fallbackGifs);
    } catch (error) {
      console.error('Error searching GIFs:', error);
      console.log('Using fallback GIFs for search...');
      setGifs(fallbackGifs);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchGifs(searchTerm);
  };

  const handleGifClick = (gif) => {
    onGifSelect({
      id: gif.id,
      url: gif.images.fixed_height.url,
      title: gif.title,
      width: gif.images.fixed_height.width,
      height: gif.images.fixed_height.height,
    });
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <Box sx={{ width: 350, maxHeight: 500, overflow: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>GIF Picker</Box>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search GIFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              endAdornment: (
                <IconButton type="submit" size="small">
                  <SearchIcon />
                </IconButton>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={1}>
            {gifs.map((gif) => (
              <Grid item xs={6} key={gif.id}>
                <Box
                  component="img"
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                      transform: 'scale(1.02)',
                    },
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleGifClick(gif)}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && gifs.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 4 }}>
            No GIFs found. Try a different search term.
          </Typography>
        )}
      </Box>
    </Popover>
  );
};

export default GifPicker;
