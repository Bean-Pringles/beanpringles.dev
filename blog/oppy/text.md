__NOTE: While I do go in depth about how I built this, this is not a build guide.__

In 4th grade my teacher showed us a movie called "Good Night Oppy," which is about the martian rover Opportunity that was only supposed to last for 90 days but instead lasted for 15 years. Well, my 4th grade mind saw this and thought how bad the rover must of have been designed to die to a puny planet wide dust storm after just a decade and a half of wear and tear on one of the most hostile enviorments known to man. Recently I remembered that feeling and thought that I my actually try to attempt it (Spoiler: My 4th grade self was way over confident, who would have guessed).

# What is Oppy

Oppy is a modified RC car that has a camera strapped to it and is thus able to maneuver in small spaces humans can't reach. It can go decently fast and it's whole goal was to be made as quick as possible, being made in just 6 hours while still looking like the classic rover look. 

# Namesake

Quite obviously, the name Oppy comes from the martian rover Opportunity, which Oppy is also the nickname given to the actual rover. 

# The Parts

To make Oppy, I used the following parts:

- Orange Pi Zero 3 4G

- Battery bought from five below

- A Logitech 720p camera

- Velcro Strips

- RC Truck

- Lots of rubber bands

- 32GB SD Card

Most of these items I had on hand, so I only used around 4 dollars worth of resources.

# Orange Pi

Because this will drive around in the dirt and whatnot, I used a case I downloaded from [here](https://www.printables.com/model/1402691-orangepi-3-zero-case-enclosure/files). I 3D printed both pieces and taped them together, using it as a barrier from outside debris.

# The OS

For the OS, I choose to use the headless version of Armbian specifically built for the Orange Pi I was working with. After a quick install and some installing of packages, it worked flawlessly.

# The Script

The script needed to be able to start a Python server, grab the feed from the camera, compress it, and then upload it to the Python server in a loop, and because I didn't want to do that, I used Claude, who actually did it really good. Once I had the script running, I could just go to the Orange Pi's IP address and see a video feed coming directly from the camera, which is basically the entire project.

Now that I had the script, I needed it to run at boot, so after a couple of quick tweaks, everytime I start the Pi the script runs. As a bonus, if the camera isn't plugged in it errors and stops itself, meaning it won't waste proccesing power on it if I am using the Pi for something else and forgot to disable it. To download the script, you can click [here](server.zip)

Also, because I didn't give it a static IP, I just use Nmap to scan my network and kind of just guess which one it is.

# Making the Mount

To make the mount, I threw together a quick design in Tinkercad, which can be downloaded [here](cad.zip). This has a spot for the battery, computer, and the pegs that allow it to connect to the frame of the RC car. This worked first try except I accidentally rotated the computer's holder 90° so it is just like that now (I only had 6 hours). Despite it's large size, it only had a couple of main segments and was really easy to print and design.

# Installing the Parts onto the Mount

To mount the computer onto the mount I used double sided tape at the bottom as well as two rubber bands at the edges to hold it down and keep it from shaking. With the battery I used velcro strips on top of more rubber bands that also held down the camera and it's bundle of wires. In total I used about 10 rubber bands not including the 20 that I snapped trying to get them on.

# Holding it onto the RC Car

I had designed peg holes for the small plastic dowls to insert through and then the metal clips to slide through the hole in the dowl locking it into place. This worked plenty fine and only had a minor hiccup when I dented one of the clips.

# Driving

Because this had a camera, I could sit at my desk as I chased my dog around the house with it or scared my brother. The camera was slightly tilted so I stuffed some paper on the lower side which allowed it to be even and looking straight ahead. It proved it be agile and fast but did not flip, which is a major plus.

# Conclusion

For a build that took 6 hours, it was really nice and quite fun. It looked cool and will now forever be on my self to be a conversation starter. Plus, it can grab any socks that fell under the coach, so it isn't totally useless

__Let's See What You Can Make!__

![Oppy](images/oppy.jpeg)