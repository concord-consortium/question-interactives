export const sheepSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <!-- Circles (color -1 -> #FFFFFF) -->
  <circle cx="247" cy="109" r="44" fill="#FFFFFF" stroke="#FFFFFF" />
  <circle cx="151" cy="146" r="81" fill="#FFFFFF" stroke="#FFFFFF" />
  <circle cx="210" cy="165" r="60" fill="#FFFFFF" stroke="#FFFFFF" />

  <!-- Polygon (color -7500403 -> #8D8D8D), filled no stroke -->
  <polygon
    points="218,120 240,165 255,165 278,120"
    fill="#8D8D8D" stroke="none"
  />

  <!-- Circle (ear) -->
  <circle cx="247.5" cy="105.5" r="33.5" fill="#8D8D8D" stroke="none" />

  <!-- Rectangles (legs) -->
  <rect x="164" y="223" width="15" height="75" fill="#FFFFFF" stroke="#FFFFFF" />
  <rect x="65"  y="221" width="15" height="75" fill="#FFFFFF" stroke="#FFFFFF" />

  <!-- Polygons (legs) -->
  <polygon
    points="45,285 30,285 30,240 15,195 45,210"
    fill="#FFFFFF" stroke="#FFFFFF"
  />
  <polygon
    points="195,285 210,285 210,240 240,210 195,210"
    fill="#FFFFFF" stroke="#FFFFFF"
  />

  <!-- Large body circle -->
  <circle cx="78" cy="158" r="75" fill="#FFFFFF" stroke="#FFFFFF" />

  <!-- Small head/ear polygons -->
  <polygon
    points="276,85 285,105 302,99 294,83"
    fill="#8D8D8D" stroke="none"
  />
  <polygon
    points="219,85 210,105 193,99 201,83"
    fill="#8D8D8D" stroke="none"
  />
</svg>
`;

export const wolfSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <!-- Polygon -16777216 true false -->
  <!-- color = #000000 (black), filled, no stroke -->
  <polygon
    points="253,133 245,131 245,133"
    fill="#000000"
    stroke="none"
  />

  <!-- Polygon -7500403 true true -->
  <!-- color = #8D8D8D (gray), filled + stroked -->
  <polygon
    points="2,194 13,197 30,191 38,193 38,205 20,226 20,257 27,265 38,266 40,260 31,253 31,230 60,206 68,198 75,209 66,228 65,243 82,261 84,268 100,267 103,261 77,239 79,231 100,207 98,196 119,201 143,202 160,195 166,210 172,213 173,238 167,251 160,248 154,265 169,264 178,247 186,240 198,260 200,271 217,271 219,262 207,258 195,230 192,198 210,184 227,164 242,144 259,145 284,151 277,141 293,140 299,134 297,127 273,119 270,105"
    fill="#8D8D8D"
    stroke="#8D8D8D"
    stroke-width="1"
    stroke-linejoin="round"
  />

  <!-- Polygon -7500403 true true -->
  <!-- color = #8D8D8D (gray), filled + stroked -->
  <polygon
    points="-1,195 14,180 36,166 40,153 53,140 82,131 134,133 159,126 188,115 227,108 236,102 238,98 268,86 269,92 281,87 269,103 269,113"
    fill="#8D8D8D"
    stroke="#8D8D8D"
    stroke-width="1"
    stroke-linejoin="round"
  />
</svg>
`;
