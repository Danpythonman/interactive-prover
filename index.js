let proofList;
let draggableItem;
let pointerStartX;
let pointerStartY;

let items = []

function getAllItems() {
    if (items != undefined && items.length <= 0) {
        items = Array.from(proofList.querySelectorAll('.item'));
    }
    return items;
}

function getIdleItems() {
  return getAllItems().filter((item) => item.classList.contains('idle'));
}

function updateItems() {
    const draggableItemRect = draggableItem.getBoundingClientRect();
    const draggableItemY = draggableItemRect.top + draggableItemRect.height / 2;

    const ITEMS_GAP = 10;

    const idleItems = getIdleItems();

    idleItems.forEach((item) => {
        const itemRect = item.getBoundingClientRect();
        const itemY = itemRect.top + itemRect.height / 2;
        if (item.hasAttribute("data-is-above")) {
            if (draggableItemY <= itemY) {
                item.dataset.isToggled = "";
            } else {
                delete item.dataset.isToggled;
            }
        } else {
            if (draggableItemY >= itemY) {
                item.dataset.isToggled = "";
            } else {
                delete item.dataset.isToggled;
            }
        }
    });

    idleItems.forEach((item) => {
        if (item.hasAttribute("data-is-toggled")) {
            const direction = item.hasAttribute("data-is-above")
                ? 1
                : -1;
            item.style.transform = `translateY(${direction * (draggableItemRect.height + ITEMS_GAP)}px)`;
        } else {
            item.style.transform = "";
        }
    });
}

function applyNewItemOrder() {
    const reorderedItems = [];
    const allItems = getAllItems();
    getAllItems().forEach((item, i) => {
        if (item == draggableItem) {
            return;
        }
        if (!item.hasAttribute("data-is-toggled")) {
            reorderedItems[i] = item;
            return;
        }
        const newIndex = item.hasAttribute("data-is-above")
            ? i + 1
            : i - 1;
        reorderedItems[newIndex] = item;
    });
    for (let i = 0; i < getAllItems().length; i++) {
        const item = reorderedItems[i];
        if (typeof item == "undefined") {
            reorderedItems[i] = draggableItem;
        }
    }
    reorderedItems.forEach((item) => {
        proofList.appendChild(item);
    });
}

function shuffleOrder() {
    const allItems = getAllItems();
    let j;
    let x
    let index;
    for (index = allItems.length - 1; index > 0; index--) {
        j = Math.floor(Math.random() * (index + 1));
        x = allItems[index];
        allItems[index] = allItems[j];
        allItems[j] = x;
    }
    allItems.forEach((item) => {
        proofList.appendChild(item);
    });
}

function checkOrder() {
    const allItems = getAllItems();
    let inOrder = true;
    let previousOrderNumber = 0;
    for (const item of allItems) {
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
    }
}

/**
 * @param {HTMLElement}
 * @param {MouseEvent} e 
 * @listens document#mousedown
 */
function drag(e) {
    console.log("Dragging");
    if (draggableItem == undefined) {
        return;
    }

    const currentPositionX = e.clientX;
    const currentPositionY = e.clientY;

    const pointerOffsetX = currentPositionX - pointerStartX;
    const pointerOffsetY = currentPositionY - pointerStartY;

    draggableItem.style.transform = `translate(${pointerOffsetX}px, ${pointerOffsetY}px)`;

    updateItems();
}

/**
 * 
 * @param {MouseEvent} e 
 * @listens document#mousedown
 */
function dragStart(e) {
    console.log("Dragging Started");
    if (e.target.classList.contains("drag-handle")) {
        draggableItem = e.target.closest(".item");

        if (draggableItem == undefined) {
            return;
        }

        draggableItem.classList.remove("idle");
        draggableItem.classList.add("motion");

        const idleItems = getIdleItems();
        const allItems = getAllItems()

        idleItems.forEach((item, i) => {
            if (allItems.indexOf(draggableItem) > i) {
                item.dataset.isAbove = "";
            }
        });

        pointerStartX = e.clientX;
        pointerStartY = e.clientY;

        document.addEventListener("mousemove", drag);
    }
}

/**
 * 
 * @param {MouseEvent} e 
 * @listens document#mousedown
 */
function dragEnd(e) {
    console.log("Dragging Ended");
    if (draggableItem == undefined) {
        return;
    }

    applyNewItemOrder();

    const allItems = getAllItems();
    allItems.forEach((item) => {
        delete item.dataset.isAbove;
        delete item.dataset.isToggled;
        item.style.transform = "";
    });
    items = [];

    draggableItem.style = null;

    draggableItem.classList.remove('motion');
    draggableItem.classList.add('idle');

    draggableItem = null;

    checkOrder();

    document.removeEventListener("mousemove", drag);
}

function setup() {
    console.log("Setup");
    proofList = document.getElementById("proof-list");
    if (proofList == undefined) {
        alert("Something is wrong here");
        return;
    }
    shuffleOrder();
    proofList.addEventListener("mousedown", dragStart);
    document.addEventListener("mouseup", dragEnd);
}

window.addEventListener("load", setup);
