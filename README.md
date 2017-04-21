clut-browser-extension
======================

Browser Extension to switch between last used tabs easily using shortcut.

This extension tries to mimic the ALT+TAB behavior from Windows (or Command+TAB in Mac) to allow to switch between open tabs in a Most Recently Used fashion.
It remembers the order in which you switched tabs (made a tab active) and it updates its records so that you can switch to the recently used ones quickly.

Default Keys:  
ALT + X: Quick switch  
ALT + Z: Normal switch  
ALT + Shift + Z: Normal switch (in opposite direction)  


=Quick switch=:  
Use for rapid switching to last tab (by pressing once) or to the second to last used tab(by pressing rapidly twice) and so on.

=Normal switch=:  
Use when you want to look for a tab recently used but when you would want to go in a slower pace (needing to glimpse for a bit to see if it is the page you need)

Most other extensions meant to accomplish the same thing don’t work well since there are some limitations/difficulties in the API.
This extension uses some basic algorithms and timers of intervals between key presses to get over these problems.
That is the reason there is separate keys for quick and slower switches with different timer settings.

Features:
* Can cycle through ALL open tabs from all browser windows in a most recently used order
* Extension DOES NOT need access to any of your visited website's data
* Can work through tabs across different browser windows
* Snappy and fast switches


FAQ:

Q: Why are there two sets of shortcuts one for quick switch and one for a slower switch. Isn’t it possible to simplify like ALT+TAB behavior ?

A: There are some restrictions in browser API which makes it difficult to implement this feature in the most natural way.
The intention was to make this extension work as close to Alt+Tab in Windows (or Cmd+Tab for Mac).
Unfortunately due to these limitations though, this extension relies on time intervals in between your key presses.
That is the reason there is a concept of quick switch (faster timer) and a normal switch (slower timer).
