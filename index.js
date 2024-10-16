/**
 * List of items of the proof.
 */
let proofList;

/**
 * The item of the proof currently being dragged.
 */
let draggableItem;

/**
 * The starting x-coordinate of the user's pointer when dragging an item.
 */
let pointerStartX;

/**
 * The starting y-coordinate of the user's pointer when dragging an item.
 */
let pointerStartY;

/**
 * Temporary list of proof list items to improve efficiency when getting all
 * list items (basically a cache).
 */
let items = []

/**
 * Gap between the items in the proof list.
 */
const ITEMS_GAP = 10;

/**
 * Gets all items from the proof list.
 *
 * @returns {HTMLDivElement[]} List of divs for the items in the proof list.
 */
function getAllItems() {
    if (items != undefined && items.length <= 0) {
        items = Array.from(proofList.querySelectorAll('.item'));
    }
    return items;
}

/**
 * Gets all idle items from the proof list.
 *
 * @returns {HTMLDivElement[]} List of divs for the items in the proof list with
 * the idle class.
 */
function getIdleItems() {
  return getAllItems().filter((item) => item.classList.contains('idle'));
}

/**
 * Updates the order of items in the proof list relative to where the user is
 * dragging an item.
 *
 * Note that this does not permanently alter the item order, just temporarily
 * moves them. The function that changes the item order is
 * {@link applyNewItemOrder}.
 */
function updateItems() {
    // Get the y-coordinate of the midpoint of the item being dragged
    const draggableItemRect = draggableItem.getBoundingClientRect();
    const draggableItemY = draggableItemRect.top + draggableItemRect.height / 2;

    const idleItems = getIdleItems();

    // Set the "data-is-toggled" property for each item that is displaced by the
    // dragged item
    idleItems.forEach((item) => {
        // Get the y-coordinate of the midpoint of the item being dragged
        const itemRect = item.getBoundingClientRect();
        const itemY = itemRect.top + itemRect.height / 2;

        if (item.hasAttribute("data-is-above")) {
            // If item is marked as above the dragged item and is now below it,
            // then mark it as "toggled"
            if (draggableItemY <= itemY) {
                item.dataset.isToggled = "";
            } else {
                delete item.dataset.isToggled;
            }
        } else {
            // If item is not marked as above the dragged item and is now above
            // it, then mark it as "toggled"
            if (draggableItemY >= itemY) {
                item.dataset.isToggled = "";
            } else {
                delete item.dataset.isToggled;
            }
        }
    });

    // Move each of the items that are displaced by the item being dragged
    idleItems.forEach((item) => {
        // Only move toggled items
        if (item.hasAttribute("data-is-toggled")) {
            // Decide whether the item needs to be moved up or down
            const direction = item.hasAttribute("data-is-above")
                ? 1
                : -1;

            // Move the item by using CSS transform
            item.style.transform =
                `translateY(${direction * (draggableItemRect.height + ITEMS_GAP)}px)`;
        } else {
            item.style.transform = "";
        }
    });
}

/**
 * Applies the new item order to the proof list.
 */
function applyNewItemOrder() {
    const reorderedItems = [];
    const allItems = getAllItems();

    allItems.forEach((item, i) => {
        // Ignore the item being dragged for now
        if (item == draggableItem) {
            return;
        }

        if (item.hasAttribute("data-is-toggled")) {
            // If the item is toggled, then its order must change. If it was above
            // the dragged item, then it must be shifted down, otherwise it must be
            // shifted up.
            const newIndex = item.hasAttribute("data-is-above")
                ? i + 1
                : i - 1;
            reorderedItems[newIndex] = item;
        } else {
            // If the item is not toggled, then add it to the reordered items
            // list without changing its order
            reorderedItems[i] = item;
            return;
        }
    });

    // Insert the item being dragged into the correct spot in the list
    for (let i = 0; i < allItems.length; i++) {
        const item = reorderedItems[i];
        // Since the spot in the list for the dragged item was skipped in the
        // foreach call above, that spot is undefined
        if (typeof item == "undefined") {
            reorderedItems[i] = draggableItem;
        }
    }

    // Add the reordered items to the proof list
    reorderedItems.forEach((item) => {
        proofList.appendChild(item);
    });
}

/**
 * Shuffles the order of the proof list.
 */
function shuffleProofListOrder() {
    const allItems = getAllItems();

    let newIndex;
    let temp;

    for (let i = allItems.length - 1; i > 0; i--) {
        newIndex = Math.floor(Math.random() * (i + 1));
        temp = allItems[i];
        allItems[i] = allItems[newIndex];
        allItems[newIndex] = temp;
    }

    allItems.forEach((item) => {
        proofList.appendChild(item);
    });
}

/**
 * Checks the order of the proof list and changes the class of the proof list if
 * correct.
 */
function checkOrder() {
    const allItems = getAllItems();
    let inOrder = true;
    let previousOrderNumber = 0;

    for (const item of allItems) {
        // For each item of the proof list, its order number (in the
        // "data-order-number" property) must be greater than that of the element
        // above it
        let orderNumber = parseInt(item.dataset.orderNumber);
        if (orderNumber > previousOrderNumber) {
            previousOrderNumber = orderNumber;
        } else {
            inOrder = false;
            break;
        }
    }

    if (inOrder) {
        proofList.classList.add("correct");
    } else {
        proofList.classList.remove("correct");
    }
}

/**
 * Moves the item being dragged and other items in the proof list relative to
 * the dragged item.
 *
 * @param {MouseEvent} e User's pointer moving around the screen.
 */
function drag(e) {
    if (draggableItem == undefined) {
        return;
    }

    // Get current position of user's pointer
    const currentPositionX = e.clientX;
    const currentPositionY = e.clientY;

    // Calculate offset from initial pointer position
    const pointerOffsetX = currentPositionX - pointerStartX;
    const pointerOffsetY = currentPositionY - pointerStartY;

    // Move the item by using CSS transform
    draggableItem.style.transform =
        `translate(${pointerOffsetX}px, ${pointerOffsetY}px)`;

    // Update items in the list by moving them up or down depending on where
    // they are relative to where the user it dragging the item
    updateItems();
}

/**
 * Starts the dragging procedure by initializing variables and adding the event
 * listener for mousemove.
 *
 * @param {MouseEvent} e User's pointer clicking on the proof list.
 */
function dragStart(e) {
    // If the element that was clicked on is a drag handle, then start the
    // dragging procedure
    if (e.target.classList.contains("drag-handle")) {
        // Get the proof list item that was dragged
        draggableItem = e.target.closest(".item");

        if (draggableItem == undefined) {
            return;
        }

        // Dragged item is now in motion
        draggableItem.classList.remove("idle");
        draggableItem.classList.add("motion");

        const idleItems = getIdleItems();
        const allItems = getAllItems()

        // Mark all items above the item being dragged
        const draggableItemIndex = allItems.indexOf(draggableItem);
        idleItems.forEach((item, i) => {
            if (draggableItemIndex > i) {
                item.dataset.isAbove = "";
            }
        });

        // Initialize starting x- and y-coordinates of the user's pointer
        pointerStartX = e.clientX;
        pointerStartY = e.clientY;

        // Add event listener for mousemove
        document.addEventListener("mousemove", drag);
    }
}

/**
 * Finishes dragging the item being dragged by applying the new order of the
 * proof list, cleaning up variables and removing event listeners, and checking
 * if the new proof list order is correct.
 *
 * @param {MouseEvent} e User's pointer no longer being held down.
 */
function dragEnd(e) {
    if (draggableItem == undefined) {
        return;
    }

    // Change the item order in the list
    applyNewItemOrder();

    // Remove the "data-is-above" and "data-is-toggled" markers on the proof
    // list elements
    const allItems = getAllItems();
    allItems.forEach((item) => {
        delete item.dataset.isAbove;
        delete item.dataset.isToggled;
        item.style.transform = "";
    });

    // Clear item cache
    items = [];
    
    // Item being dragged no longer in motion
    draggableItem.style.transform = '';
    draggableItem.classList.remove('motion');
    draggableItem.classList.add('idle');

    draggableItem = null;

    // Check if the proof order is now correct
    checkOrder();

    // Remove the mousemove event listener
    document.removeEventListener("mousemove", drag);
}

/**
 * Performs initialization by getting the proof list, shuffling the order of the
 * proof list, and adding event for mouseup and mousedown events.
 */
function setup() {
    proofList = document.getElementById("proof-list");

    if (proofList == undefined) {
        alert("Something is wrong here");
        return;
    }

    // Shuffle proof list
    shuffleProofListOrder();

    // Add event listener on the proof list for starting the dragging procedure
    proofList.addEventListener("mousedown", dragStart);

    // Add event listener on the screen for ending the dragging procedure
    document.addEventListener("mouseup", dragEnd);
}

window.addEventListener("load", setup);
