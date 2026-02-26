import React, { useCallback, useMemo } from 'react';
import { Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Box } from '@mui/material';
import FilterMediaList from './FilterMediaList';

const ITEM_HEIGHT = 320;
const MIN_ITEM_WIDTH = 180;
const GAP = 12;

const VirtualizedMediaGrid = ({ items, genres, mediaType, minHeight = 600 }) => {
  const Cell = useCallback(({ columnIndex, rowIndex, style, data }) => {
    const { items: dataItems, columnCount, genres: dataGenres, mediaType: dataMediaType } = data;
    const index = rowIndex * columnCount + columnIndex;
    
    if (index >= dataItems.length) {
      return null;
    }

    const item = dataItems[index];
    
    return (
      <Box
        style={{
          ...style,
          left: style.left + GAP / 2,
          top: style.top + GAP / 2,
          width: style.width - GAP,
          height: style.height - GAP,
        }}
      >
        <FilterMediaList
          item={item}
          genres={dataGenres}
          mediaType={dataMediaType}
        />
      </Box>
    );
  }, []);

  const itemData = useMemo(() => ({
    items,
    genres,
    mediaType,
  }), [items, genres, mediaType]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', height: minHeight }}>
      <AutoSizer>
        {({ height, width }) => {
          const columnCount = Math.max(2, Math.floor(width / MIN_ITEM_WIDTH));
          const columnWidth = width / columnCount;
          const rowCount = Math.ceil(items.length / columnCount);

          return (
            <Grid
              columnCount={columnCount}
              columnWidth={columnWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={ITEM_HEIGHT}
              width={width}
              itemData={{ ...itemData, columnCount }}
              overscanRowCount={2}
            >
              {Cell}
            </Grid>
          );
        }}
      </AutoSizer>
    </Box>
  );
};

export default VirtualizedMediaGrid;

