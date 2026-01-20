# Manual Testing Guide for Foodie Eyes

This guide will help you test all functionality of the application, especially query handling and search features.

## Prerequisites

### 1. Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Groq API Key (for AI query refinement and analysis)
GROQ_API_KEY=your_groq_api_key_here

# Serper API Key (for Google Maps Places search)
SERPER_API_KEY=your_serper_api_key_here

# Firebase Configuration (for authentication and user data)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## Testing Checklist

### ✅ Phase 1: Basic Setup & UI

- [ ] Application loads without errors
- [ ] Search bar is visible and functional
- [ ] Location selector/input is visible
- [ ] No console errors in browser DevTools

---

### ✅ Phase 2: Location Testing

#### Test 2.1: Location Selection
1. Click on location input/selector
2. Try different location inputs:
   - [ ] Enter a city name (e.g., "Kalyani", "Kolkata", "Mumbai")
   - [ ] Use current location (if GPS enabled)
   - [ ] Enter a full address
   - [ ] Use location autocomplete suggestions

**Expected**: Location should be set and displayed correctly

---

### ✅ Phase 3: Food Query Testing

#### Test 3.1: Basic Food Items
Test these queries and verify results show relevant food places:

- [ ] `pizza`
- [ ] `burger`
- [ ] `coffee`
- [ ] `biryani`
- [ ] `chocolate cake`
- [ ] `ice cream`
- [ ] `noodles`
- [ ] `dosa`

**Expected**: 
- Results show food places related to the query
- Cards display with ratings, addresses, and details
- No "not food" rejection messages

#### Test 3.2: Multi-word Food Queries
- [ ] `chocolate cake` (should find cake shops, bakeries)
- [ ] `idli dosa sambar` (should find South Indian restaurants)
- [ ] `butter chicken` (should find North Indian restaurants)
- [ ] `paneer tikka` (should find Indian restaurants)

**Expected**: 
- System understands multi-word queries
- Results are relevant to all terms, not just the first word
- For cuisine-specific items (idli, dosa), South Indian restaurants should appear first

#### Test 3.3: Cuisine-Specific Queries
- [ ] `South Indian` or `idli dosa sambar`
  - **Expected**: South Indian restaurants appear first, even if Chinese restaurants have higher ratings
- [ ] `North Indian` or `butter chicken naan`
  - **Expected**: North Indian restaurants prioritized
- [ ] `Chinese` or `noodles manchurian`
  - **Expected**: Chinese restaurants prioritized
- [ ] `Italian` or `pasta pizza`
  - **Expected**: Italian restaurants prioritized

**Expected**: 
- Cuisine-specific places rank higher than others
- Cuisine expansion triggers when needed (searches for "South Indian restaurants" if initial results are mixed)

#### Test 3.4: Ambiance & Mood Queries
- [ ] `cozy cafe`
- [ ] `quiet restaurant`
- [ ] `romantic dinner`
- [ ] `late night food`

**Expected**: 
- System understands ambiance keywords
- Results match both place type (cafe/restaurant) and ambiance (cozy/quiet)

#### Test 3.5: Conversational Queries
- [ ] `suggest me some iconic places to try`
- [ ] `best restaurants`
- [ ] `popular places`
- [ ] `where to eat`
- [ ] `famous places`
- [ ] `must visit restaurants`

**Expected**: 
- System recognizes conversational patterns
- Converts to searchable queries (e.g., "popular restaurants")
- Returns relevant food places

---

### ✅ Phase 4: Non-Food Query Rejection

#### Test 4.1: Non-Food Items (Should be Rejected)
Test these queries and verify they are rejected with appropriate message:

- [ ] `sweater`
- [ ] `iPhone`
- [ ] `laptop`
- [ ] `shoes`
- [ ] `hospital`
- [ ] `gym`
- [ ] `car`

**Expected**: 
- Shows message: "Sorry, I can only help with food or drinks. Please enter something edible or drinkable."
- No search results displayed
- No API errors

---

### ✅ Phase 5: Search Result Quality

#### Test 5.1: Result Relevance
For each query, verify:
- [ ] Results are relevant to the search query
- [ ] Place types match (e.g., "cafe" query shows cafes, not parks)
- [ ] Ratings and reviews are displayed
- [ ] Addresses are accurate
- [ ] Images/thumbnails load (if available)

#### Test 5.2: Result Ranking
- [ ] Cuisine-specific queries prioritize matching cuisines
- [ ] Place type queries prioritize matching place types (cafe → cafes, not parks)
- [ ] Results are sorted by relevance score (not just rating)

#### Test 5.3: Fallback Messages
Test queries that might have limited results:
- [ ] Very specific items in small towns
- [ ] Rare cuisines in certain areas

**Expected**: 
- If results exist but are limited, shows helpful "Search Note" with amber styling
- Message is informative, not alarming
- Still shows available results

---

### ✅ Phase 6: Filters & Preferences

#### Test 6.1: Budget Filter
- [ ] Set budget filter (e.g., ₹500, ₹1000)
- [ ] Search for food items
- [ ] Verify results respect budget (if implemented)

#### Test 6.2: Allergen Filter
- [ ] Select allergens to avoid (e.g., nuts, dairy)
- [ ] Search for food items
- [ ] Verify results consider allergens (if implemented)

#### Test 6.3: Preferences
- [ ] Set food preferences
- [ ] Search for food items
- [ ] Verify preferences are considered in results

---

### ✅ Phase 7: Place Details

#### Test 7.1: Place Card Information
Click on any result card and verify:
- [ ] Place name is displayed
- [ ] Rating and review count are shown
- [ ] Address is accurate
- [ ] Phone number (if available)
- [ ] Website link (if available)
- [ ] Map location (if available)
- [ ] Reviews/snippets are displayed

#### Test 7.2: Place Actions
- [ ] Bookmark functionality works
- [ ] Share functionality works (if implemented)
- [ ] Directions/map link works

---

### ✅ Phase 8: Edge Cases & Error Handling

#### Test 8.1: Empty/Invalid Queries
- [ ] Empty search (just press enter)
- [ ] Only spaces
- [ ] Special characters only

**Expected**: Appropriate error handling or validation message

#### Test 8.2: Spelling Errors
- [ ] `Piza` (should correct to "Pizza")
- [ ] `Biriani` (should correct to "Biryani")
- [ ] `Cofee` (should correct to "Coffee")

**Expected**: 
- System corrects spelling
- Shows corrected term
- Searches with corrected query

#### Test 8.3: Location Edge Cases
- [ ] No location set
- [ ] Invalid location
- [ ] Very remote location with limited results

**Expected**: Appropriate handling and user feedback

#### Test 8.4: API Failures
- [ ] Test with invalid API keys (temporarily)
- [ ] Test with network disconnected

**Expected**: Graceful error handling, user-friendly error messages

---

### ✅ Phase 9: User Authentication (If Implemented)

#### Test 9.1: Sign In
- [ ] Google Sign-In works
- [ ] Email/Password sign-in works (if implemented)

#### Test 9.2: User Data
- [ ] Bookmarks are saved per user
- [ ] Search history is saved per user
- [ ] User profile displays correctly

---

### ✅ Phase 10: Performance & UX

#### Test 10.1: Loading States
- [ ] Loading indicator appears during search
- [ ] Loading state is clear and not too long
- [ ] No flickering or layout shifts

#### Test 10.2: Responsive Design
- [ ] Test on mobile viewport
- [ ] Test on tablet viewport
- [ ] Test on desktop viewport
- [ ] All UI elements are accessible and functional

#### Test 10.3: Search Speed
- [ ] Search completes within reasonable time (< 5 seconds)
- [ ] Results appear progressively (if implemented)
- [ ] No unnecessary API calls

---

## Specific Test Scenarios (Based on Previous Issues)

### Scenario 1: "idli dosa sambar" Query
**Steps**:
1. Set location to "Kalyani" (or your test location)
2. Search: `idli dosa sambar`
3. Check results

**Expected**:
- ✅ South Indian restaurants appear first
- ✅ More than 2 South Indian restaurants (if available in area)
- ✅ Chinese restaurants should NOT appear above South Indian ones
- ✅ Cuisine expansion triggers (searches for "South Indian restaurants")
- ✅ Results are sorted by cuisine match priority, not just rating

### Scenario 2: "Biryani" Query
**Steps**:
1. Set location
2. Search: `biryani`
3. Check results

**Expected**:
- ✅ Shows biryani restaurants (can be North Indian, South Indian, or mixed)
- ✅ No incorrect cuisine classification
- ✅ No "Found X South Indian restaurants" message if biryani is ambiguous

### Scenario 3: "cozy cafe" Query
**Steps**:
1. Set location
2. Search: `suggest me some quite and cozy cafe`
3. Check results

**Expected**:
- ✅ Shows cafes (not parks or other places)
- ✅ Results match "cozy" and "quiet" ambiance
- ✅ Place type filtering works (cafe → cafes only)

### Scenario 4: "chocolate cake" Query
**Steps**:
1. Set location
2. Search: `chocolate cake`
3. Check results

**Expected**:
- ✅ Finds bakeries, cafes, or dessert places
- ✅ Multi-word matching works (not just "chocolate")
- ✅ Results are relevant to both terms

---

## Browser Console Monitoring

While testing, keep the browser DevTools Console open and check for:

- [ ] No JavaScript errors
- [ ] No API errors (check Network tab)
- [ ] No React warnings
- [ ] API calls are successful (status 200)
- [ ] No excessive API calls (performance)

---

## Common Issues to Watch For

1. **"Not available" messages when results exist**
   - Check if location filtering is too strict
   - Verify multi-word query matching

2. **Wrong cuisine ranking**
   - Verify cuisine detection is working
   - Check scoring system prioritizes cuisine matches

3. **Place type mismatches (e.g., parks for cafe queries)**
   - Verify place type filtering
   - Check scoring system penalizes wrong place types

4. **Slow search performance**
   - Check API response times
   - Verify no unnecessary API calls

5. **Spelling corrections not working**
   - Verify Groq API is responding correctly
   - Check JSON parsing

---

## Quick Test Command Reference

```bash
# Start development server
npm run dev

# Build for production (to test production build)
npm run build
npm start

# Check for linting errors
npm run lint
```

---

## Notes

- Test with different locations to verify location-specific behavior
- Some features may require authentication (bookmarks, history)
- API rate limits may affect testing (Groq, Serper)
- Results will vary based on location and available places in that area

---

## Reporting Issues

When reporting issues, include:
1. Query used
2. Location set
3. Expected behavior
4. Actual behavior
5. Browser console errors (if any)
6. Network tab API responses (if relevant)
