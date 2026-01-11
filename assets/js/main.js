/*
	Parallelism by HTML5 UP
	html5up.net | @ajlkn
	Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {

	var	$window = $(window),
		$body = $('body'),
		$wrapper = $('#wrapper'),
		$main = $('#main'),
		settings = {

			// Keyboard shortcuts.
				keyboardShortcuts: {

					// If true, enables scrolling via keyboard shortcuts.
						enabled: true,

					// Sets the distance to scroll when using the left/right arrow keys.
						distance: 50

				},

			// Scroll wheel.
				scrollWheel: {

					// If true, enables scrolling via the scroll wheel.
						enabled: true,

					// Sets the scroll wheel factor. (Ideally) a value between 0 and 1 (lower = slower scroll, higher = faster scroll).
						factor: 1

				},

			// Scroll zones.
				scrollZones: {

					// If true, enables scrolling via scroll zones on the left/right edges of the scren.
						enabled: true,

					// Sets the speed at which the page scrolls when a scroll zone is active (higher = faster scroll, lower = slower scroll).
						speed: 15

				}

		};

	// Expose settings globally for modal access
		window.settings = settings;

	// Breakpoints.
		breakpoints({
			xlarge:  [ '1281px',  '1680px' ],
			large:   [ '981px',   '1280px' ],
			medium:  [ '737px',   '980px'  ],
			small:   [ '481px',   '736px'  ],
			xsmall:  [ null,      '480px'  ],
		});

	// Tweaks/fixes.

		// Mobile: Revert to native scrolling.
			if (browser.mobile) {

				// Disable all scroll-assist features.
					settings.keyboardShortcuts.enabled = false;
					settings.scrollWheel.enabled = false;
					settings.scrollZones.enabled = false;

				// Re-enable overflow on main.
					$main.css('overflow-x', 'auto');

			}

		// IE: Fix min-height/flexbox.
			if (browser.name == 'ie')
				$wrapper.css('height', '100vh');

		// iOS: Compensate for address bar.
			if (browser.os == 'ios')
				$wrapper.css('min-height', 'calc(100vh - 30px)');

	// Play initial animations on page load.
		$window.on('load', function() {
			window.setTimeout(function() {
				$body.removeClass('is-preload');
			}, 100);
		});

	// Items.

		// Assign a random "delay" class to each thumbnail item.
			$('.item.thumb').each(function() {
				$(this).addClass('delay-' + Math.floor((Math.random() * 6) + 1));
			});

		// IE: Fix thumbnail images.
			if (browser.name == 'ie')
				$('.item.thumb').each(function() {

					var $this = $(this),
						$img = $this.find('img');

					$this
						.css('background-image', 'url(' + $img.attr('src') + ')')
						.css('background-size', 'cover')
						.css('background-position', 'center');

					$img
						.css('opacity', '0');

				});

	// Poptrox with click tracking.
		var clickCounts = {};
		var currentImageUrl = null;
		var currentCustomUrl = null;
		
		// Track which link is clicked before popup opens
		$('.item.thumb a.image').on('click', function() {
			currentImageUrl = $(this).attr('href');
			currentCustomUrl = $(this).data('url');
			console.log('Link clicked - Image URL:', currentImageUrl);
			console.log('Link clicked - Custom URL:', currentCustomUrl);
		});
		
		$main.poptrox({
			onPopupOpen: function() { 
				$body.addClass('is-poptrox-visible');
				
				// Initialize click count for this image if it doesn't exist
				if (!clickCounts[currentImageUrl]) {
					clickCounts[currentImageUrl] = 0;
				}
				
				console.log('Popup opened for:', currentImageUrl);
				console.log('Custom URL:', currentCustomUrl);
				console.log('Current click count:', clickCounts[currentImageUrl]);
				
				// Wait for popup to be fully rendered
				setTimeout(function() {
					var $popup = $('.poptrox-popup');
					
					// Add click handler to the entire popup
					$popup.off('click.customUrl').on('click.customUrl', function(e) {
						// Only respond to clicks on the image area (not nav buttons)
						if ($(e.target).is('img') || $(e.target).hasClass('poptrox-popup')) {
							clickCounts[currentImageUrl]++;
							console.log('Popup clicked! Count now:', clickCounts[currentImageUrl]);
							
							// On second click, open custom URL
							if (clickCounts[currentImageUrl] >= 1 && currentCustomUrl) {
								console.log('Opening URL:', currentCustomUrl);
								e.preventDefault();
								e.stopPropagation();
								e.stopImmediatePropagation();
								window.open(currentCustomUrl, '_blank');
								clickCounts[currentImageUrl] = 0; // Reset counter
								return false;
							}
						}
					});
					
				}, 100);
			},
			onPopupClose: function() { 
				$body.removeClass('is-poptrox-visible');
				$('.poptrox-popup').off('click.customUrl');
			},
			overlayColor: '#1a1f2c',
			overlayOpacity: 0.75,
			popupCloserText: '',
			popupLoaderText: '',
			selector: '.item.thumb a.image',
			caption: function($a) {
				return $a.prev('h2').html();
			},
			usePopupDefaultStyling: false,
			usePopupCloser: false,
			usePopupCaption: true,
			usePopupNav: true,
			windowMargin: 50
		});

		breakpoints.on('>small', function() {
			$main[0]._poptrox.windowMargin = 50;
		});

		breakpoints.on('<=small', function() {
			$main[0]._poptrox.windowMargin = 0;
		});

	// Keyboard shortcuts.
		if (settings.keyboardShortcuts.enabled)
			(function() {

				$window

					// Keypress event.
						.on('keydown', function(event) {

							var scrolled = false;

							if ($body.hasClass('is-poptrox-visible'))
								return;

							// Skip if modal is visible
							if ($body.hasClass('is-modal-visible'))
								return;

							switch (event.keyCode) {

								// Left arrow.
									case 37:
										$main.scrollLeft($main.scrollLeft() - settings.keyboardShortcuts.distance);
										scrolled = true;
										break;

								// Right arrow.
									case 39:
										$main.scrollLeft($main.scrollLeft() + settings.keyboardShortcuts.distance);
										scrolled = true;
										break;

								// Page Up.
									case 33:
										$main.scrollLeft($main.scrollLeft() - $window.width() + 100);
										scrolled = true;
										break;

								// Page Down, Space.
									case 34:
									case 32:
										$main.scrollLeft($main.scrollLeft() + $window.width() - 100);
										scrolled = true;
										break;

								// Home.
									case 36:
										$main.scrollLeft(0);
										scrolled = true;
										break;

								// End.
									case 35:
										$main.scrollLeft($main.width());
										scrolled = true;
										break;

							}

							// Scrolled?
								if (scrolled) {

									// Prevent default.
										event.preventDefault();
										event.stopPropagation();

									// Stop link scroll.
										$main.stop();

								}

						});

			})();

	// Scroll wheel.
		if (settings.scrollWheel.enabled)
			(function() {

				// Based on code by @miorel + @pieterv of Facebook (thanks guys :)
				// github.com/facebook/fixed-data-table/blob/master/src/vendor_upstream/dom/normalizeWheel.js
					var normalizeWheel = function(event) {

						var	pixelStep = 10,
							lineHeight = 40,
							pageHeight = 800,
							sX = 0,
							sY = 0,
							pX = 0,
							pY = 0;

						// Legacy.
							if ('detail' in event)
								sY = event.detail;
							else if ('wheelDelta' in event)
								sY = event.wheelDelta / -120;
							else if ('wheelDeltaY' in event)
								sY = event.wheelDeltaY / -120;

							if ('wheelDeltaX' in event)
								sX = event.wheelDeltaX / -120;

						// Side scrolling on FF with DOMMouseScroll.
							if ('axis' in event
							&&	event.axis === event.HORIZONTAL_AXIS) {
								sX = sY;
								sY = 0;
							}

						// Calculate.
							pX = sX * pixelStep;
							pY = sY * pixelStep;

							if ('deltaY' in event)
								pY = event.deltaY;

							if ('deltaX' in event)
								pX = event.deltaX;

							if ((pX || pY)
							&&	event.deltaMode) {

								if (event.deltaMode == 1) {
									pX *= lineHeight;
									pY *= lineHeight;
								}
								else {
									pX *= pageHeight;
									pY *= pageHeight;
								}

							}

						// Fallback if spin cannot be determined.
							if (pX && !sX)
								sX = (pX < 1) ? -1 : 1;

							if (pY && !sY)
								sY = (pY < 1) ? -1 : 1;

						// Return.
							return {
								spinX: sX,
								spinY: sY,
								pixelX: pX,
								pixelY: pY
							};

					};

				// Wheel event.
					$body.on('wheel', function(event) {

						// Disable on <=small.
							if (breakpoints.active('<=small'))
								return;

						// Skip if modal is visible
							if ($body.hasClass('is-modal-visible'))
								return;

						// Prevent default.
							event.preventDefault();
							event.stopPropagation();

						// Stop link scroll.
							$main.stop();

						// Calculate delta, direction.
							var	n = normalizeWheel(event.originalEvent),
								x = (n.pixelX != 0 ? n.pixelX : n.pixelY),
								delta = Math.min(Math.abs(x), 150) * settings.scrollWheel.factor,
								direction = x > 0 ? 1 : -1;

						// Scroll page.
							$main.scrollLeft($main.scrollLeft() + (delta * direction));

					});

			})();

	// Scroll zones.
		if (settings.scrollZones.enabled)
			(function() {

				var	$left = $('<div class="scrollZone left"></div>'),
					$right = $('<div class="scrollZone right"></div>'),
					$zones = $left.add($right),
					paused = false,
					intervalId = null,
					direction,
					activate = function(d) {

						// Disable on <=small.
							if (breakpoints.active('<=small'))
								return;

						// Skip if modal is visible
							if ($body.hasClass('is-modal-visible'))
								return;

						// Paused? Bail.
							if (paused)
								return;

						// Stop link scroll.
							$main.stop();

						// Set direction.
							direction = d;

						// Initialize interval.
							clearInterval(intervalId);

							intervalId = setInterval(function() {
								$main.scrollLeft($main.scrollLeft() + (settings.scrollZones.speed * direction));
							}, 25);

					},
					deactivate = function() {

						// Unpause.
							paused = false;

						// Clear interval.
							clearInterval(intervalId);

					};

				$zones
					.appendTo($wrapper)
					.on('mouseleave mousedown', function(event) {
						deactivate();
					});

				$left
					.css('left', '0')
					.on('mouseenter', function(event) {
						activate(-1);
					});

				$right
					.css('right', '0')
					.on('mouseenter', function(event) {
						activate(1);
					});

				$body
					.on('---pauseScrollZone', function(event) {

						// Pause.
							paused = true;

						// Unpause after delay.
							setTimeout(function() {
								paused = false;
							}, 500);

					});

			})();

	// Contact Modal.
		window.addEventListener('load', function() {

			var modal = document.getElementById('contactModal');
			var openBtn = document.getElementById('contact-btn');
			var closeBtn = document.querySelector('.close');
			var form = document.getElementById('contactForm');
			var submitBtn = document.getElementById('submitBtn');
			var successMessage = document.getElementById('successMessage');
			var errorMessage = document.getElementById('errorMessage');

			// Exit if modal elements don't exist
			if (!modal || !openBtn || !closeBtn) return;

			openBtn.onclick = function(e) {
				e.preventDefault();
				modal.style.display = 'block';
				document.body.classList.add('is-modal-visible');

				// Freeze background
				document.body.style.overflow = 'hidden';

				// Allow modal scroll without affecting body
				modal.addEventListener('wheel', stopPropagation, {passive:false});
				modal.addEventListener('touchmove', stopPropagation, {passive:false});
			};

			function stopPropagation(e) {
				e.stopPropagation(); // let modal scroll inside
			}

			function closeIt() {
				modal.style.display = 'none';
				document.body.classList.remove('is-modal-visible');
				document.body.style.overflow = '';

				modal.removeEventListener('wheel', stopPropagation, {passive:false});
				modal.removeEventListener('touchmove', stopPropagation, {passive:false});
			}

			closeBtn.onclick = function(e) { e.preventDefault(); closeIt(); };
			modal.onclick = function(e) { if (e.target === modal) closeIt(); };
			document.onkeydown = function(e) { if (e.key === 'Escape' && modal.style.display==='block') closeIt(); };

			// Form submission
			if (submitBtn && form) {
				submitBtn.onclick = function(e) {
					e.preventDefault();
					
					var formData = new FormData(form);
					submitBtn.textContent = 'Sending...';
					submitBtn.style.opacity = '0.6';
					submitBtn.style.pointerEvents = 'none';

					fetch('https://api.web3forms.com/submit', {
						method: 'POST',
						body: formData
					})
					.then(function(response) {
						return response.json();
					})
					.then(function(data) {
						if (data.success) {
							successMessage.classList.add('show');
							form.reset();
							setTimeout(function() {
								successMessage.classList.remove('show');
								closeIt();
							}, 2000);
						} else {
							errorMessage.classList.add('show');
							setTimeout(function() {
								errorMessage.classList.remove('show');
							}, 3000);
						}
					})
					.catch(function(error) {
						errorMessage.classList.add('show');
						setTimeout(function() {
							errorMessage.classList.remove('show');
						}, 3000);
					})
					.finally(function() {
						submitBtn.textContent = 'Send Message';
						submitBtn.style.opacity = '1';
						submitBtn.style.pointerEvents = 'auto';
					});
				};
			}

		});

})(jQuery);