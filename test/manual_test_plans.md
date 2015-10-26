# When there are no reference points

## Movements should be independent.
1. Drag the map on the left => the map on the right stays motionless.
2. Drag the map on the right => the map on the left stays motionless.

## Zoom should be synchronized.
1. Zoom the map on the left => the map on the right should zoom too.
2. Zoom the map on the right => the map on the left should zoom too.

## Can search for a reference point by text.
1. Search for a real location in the left map reference point search box and select it => map and reference point marker on the left are moved to selected location, map is centered on the reference point.
2. Move a map so that reference point in the lower left corner.
3. Search for a real location in the right map reference point search box and select it => reference point marker on the right is still in the lower left corner.

## Can add reference point after comparison point.
0. Reset the state, it is important there are no reference points.
1. Search for a real location in the left map comparison point search box and select it => a marker should be put in correct location.
2. Search for a real location in the left map reference point search box and select it => map and reference point marker on the left are moved to selected location, map is centered on the reference point, a circle is drawn on the left map only.


# When one map has a reference point

## Moving comparison point to a map without a reference point should hide circles.
1. Given that you have a reference point on the left map.
2. Double click the map on the left => a marker should be put on the double click position, circle with a center at reference point and going through comparison point should be shown on the left map, no circle should be on the right map.
3. Search for a real location in the right map comparison point search box and select it => the comparison marker should be shown on the right map in correct location, no circles should be shown.


# When both maps have reference points

## Movements should be synchronized.
1. Drag the map on the left => the map on the right should move too.
2. Drag the map on the right => the map on the left should move too.

## Zoom should be syncronized.
1. Zoom the map on the left => the map on the right should zoom too.
2. Zoom the map on the right => the map on the left should zoom too.

## Double click should put a comparison location marker.
1. Double click the map on the left => a marker should be put on the double click position, circle with a center at reference point and going through comparison point should be shown on the left map, circle of the same size should be shown at the right map.
2. Double click the map on the left within the circle => the comparison marker should move to a new position, circle should become smaller.
3. Double click the map on the right => the comparison marker should be shown on the right map, circles should update radii.

## Dragging reference point should update its position.
1. Drag the reference point on the left map to the lower right corner => the right map should keep reference point at the same coordinates and update map so that the reference marker is in the lower right corner too.
2. Double click on the left map.
3. Drag the reference point on the left map to the center => circle on the left map has center at the reference point and goes through comparison point, circle on the right map has the same radius as on the left.
4. Drag the reference point on the right map => circles' radius should stay the same.

## Can search for a reference point by text.
1. Search for a real location in the left map reference point search box and select it => map and reference point marker on the left are moved to selected location, circles should update radii so that circle still goes through the comparison point.
2. Move a map so that reference point in the lower left corner.
3. Search for a real location in the right map reference point search box and select it => reference point marker on the right is still in the lower left corner.

## Can search for a comparison point by text.
1. Search for a real location in the left map comparison point search box and select it => the comparison marker should be put on selected location, circles should be drawn.
2. Search for a real location in the right map comparison point search box and select it => the comparison marker should be shown on the right map in correct location, circles should update radii.

## Clearing a search box removes corresponding marker.
1. Clear value in the right map reference point search box and press enter => the reference point marker on the right map is hidden, on the left map it is still present, circles on both maps are hidden.
2. Clear value in the right map comparison point search box and press enter => the comparison marker should be hidden.

## Searching for garbage removes corresponding marker.
0. Search for a valid reference point and comparison point in the right map.
1. Search for some garbage like "sldkfjsldfkjsdf" in right map reference point search box and press enter => the reference point marker on the right map is hidden, on the left map it is still present, circles on both maps are hidden.
2. Search for some garbage like "sldkfjsldfkjsdf" in the right map comparison point search box and press enter => the comparison marker should be hidden.

## Current state should be reflected in URL.
1. Do whatever actions you like => URL line in browser changes.
2. Open another page with the same URL => state should be the same as in the first page.
