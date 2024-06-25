// Websocket
const socket = new ReconnectingWebSocket('ws://127.0.0.1:7270/')
socket.onclose = event => {
    console.log('Socket Closed Connection: ', event)
    socket.send('Client Closed!')
}
socket.onopen = () => {
    console.log('Successfully Connected')
}

const sceneCollection = document.getElementById("sceneCollection")
let autoadvance_button = document.getElementById('autoAdvanceButton')
let autoadvance_timer_container = document.getElementById('autoAdvanceTimer')
let autoadvance_timer_label = document.getElementById('autoAdvanceTimerLabel')
autoadvance_timer_container.style.opacity = '0'

let enableAutoAdvance = false
const gameplay_scene_name = "Gameplay (Gameplay)"
const idle_scene_name = "Gameplay (Idle)"
const mappool_scene_name = "Mappool"
const team_win_scene_name = "Team Win"

function switchAutoAdvance() {
    enableAutoAdvance = !enableAutoAdvance
    if (enableAutoAdvance) {
        autoadvance_button.innerHTML = 'AUTO ADVANCE: ON'
        autoadvance_button.style.backgroundColor = '#9ffcb3'
    } else {
        autoadvance_button.innerHTML = 'AUTO ADVANCE: OFF'
        autoadvance_button.style.backgroundColor = '#fc9f9f'
    }
}

const obsGetCurrentScene = window.obsstudio?.getCurrentScene ?? (() => {})
const obsGetScenes = window.obsstudio?.getScenes ?? (() => {})
const obsSetCurrentScene = window.obsstudio?.setCurrentScene ?? (() => {})

obsGetScenes(scenes => {
    for (const scene of scenes) {
        let clone = document.getElementById("sceneButtonTemplate").content.cloneNode(true)
        let buttonNode = clone.querySelector('div')
        buttonNode.id = `scene__${scene}`
        buttonNode.textContent = `GO TO: ${scene}`
        buttonNode.onclick = function() { obsSetCurrentScene(scene); }
        sceneCollection.appendChild(clone)
    }

    obsGetCurrentScene((scene) => { document.getElementById(`scene__${scene.name}`).classList.add("activeScene") })
})

window.addEventListener('obsSceneChanged', function(event) {
    let activeButton = document.getElementById(`scene__${event.detail.name}`)
    for (const scene of sceneCollection.children) { scene.classList.remove("activeScene") }
    activeButton.classList.add("activeScene")
})

// Star system
const redTeamWinStars = document.getElementById("redTeamWinStars")
const blueTeamWinStars = document.getElementById("blueTeamWinStars")
const tiebreakerContainer = document.getElementsByClassName("tiebreakerContainer")[0]
let currentBestOf = 0, currentFirstTo = 0
let currentStarRed = 0, currentStarBlue = 0
// Generate stars
function generateStarsDisplay(action) {
    if (currentStarRed > currentFirstTo) currentStarRed = currentFirstTo
    if (currentStarBlue > currentFirstTo) currentStarBlue = currentFirstTo
    if (currentStarRed < 0) currentStarRed = 0
    if (currentStarBlue < 0) currentStarBlue = 0

    // Generate or remove new (blank) stars
    redTeamWinStars.innerHTML = ""
    blueTeamWinStars.innerHTML = ""

    // Red stars
    createStars(redTeamWinStars, "teamRedWinStar", "teamRedWinStarFill", currentStarRed)
    createStars(redTeamWinStars, "teamRedWinStar", null, currentFirstTo - currentStarRed)

    // Blue stars
    createStars(blueTeamWinStars, "teamBlueWinStar", "teamBlueWinStarFill", currentStarBlue)
    createStars(blueTeamWinStars, "teamBlueWinStar", null, currentFirstTo - currentStarBlue)

    if (action === "plus" && currentStarRed === currentStarBlue && currentStarRed + 1 === currentFirstTo &&
        window.getComputedStyle(tiebreakerContainer).display === "none") {
        changeNextAction("Tiebreaker", "Plus")
    }
}
function createStars(container, starClass, fillClass, count) {
    for (let i = 0; i < count; i++) {
        const teamWinStars = document.createElement("div")
        teamWinStars.classList.add("teamWinStar", starClass)
        if (fillClass && i < count) teamWinStars.classList.add(fillClass)
        container.append(teamWinStars)
    }
}
function changeStarCount(team, action) {
    if (!warmupMode) {
        if (team === "red" && action === "plus") currentStarRed++
        if (team === "red" && action === "minus") currentStarRed--
        if (team === "blue" && action === "plus") currentStarBlue++
        if (team === "blue" && action === "minus") currentStarBlue--

        if (currentStarRed > currentFirstTo) currentStarRed = currentFirstTo
        if (currentStarBlue > currentFirstTo) currentStarBlue = currentFirstTo
        if (currentStarRed < 0) currentStarRed = 0
        if (currentStarBlue < 0) currentStarBlue = 0
        generateStarsDisplay(action)

        // Set cookies
        document.cookie = `currentStarRed=${currentStarRed}; path=/`
        document.cookie = `currentStarBlue=${currentStarBlue}; path=/`

        // Set match winner
        if (currentStarRed === currentFirstTo) {
            document.cookie = `currentMatchWinner=${currentTeamRedName}; path=/`
            document.cookie = `currentMatchWinnerColour=red; path=/`
        } else if (currentStarBlue === currentFirstTo) {
            document.cookie = `currentMatchWinner=${currentTeamBlueName}; path=/`
            document.cookie = `currentMatchWinnerColour=blue; path=/`
        } else {
            document.cookie = `currentMatchWinner=noWinner; path=/`
        }
    }
}
function resetStars() {
    currentStarRed = 0
    currentStarBlue = 0

    document.cookie = `currentStarRed=${currentStarRed}; path=/`
    document.cookie = `currentStarBlue=${currentStarBlue}; path=/`

    generateStarsDisplay()
}

// Json Bin Details
const playerJsonBinId = "66180208acd3cb34a836d684"
const mappoolJsonBinId = "66180211acd3cb34a836d689"
const jsonBinApiKey = "" // Change api key
// Player information
let allPlayers
let allPlayersRequest = new XMLHttpRequest()
allPlayersRequest.onreadystatechange = () => {
    if (allPlayersRequest.readyState == XMLHttpRequest.DONE) {
        allPlayers = JSON.parse(allPlayersRequest.responseText).record
    }
}
allPlayersRequest.open("GET", `https://api.jsonbin.io/v3/b/${playerJsonBinId}`, false)
allPlayersRequest.setRequestHeader("X-Master-Key", jsonBinApiKey)
allPlayersRequest.send()
// Mappool information
const roundName = document.getElementById("roundName")
const redBanTiles = document.getElementById("redBanTiles")
const blueBanTiles = document.getElementById("blueBanTiles")
const pickTiles = document.getElementById("pickTiles")
const redPickTiles = document.getElementById("redPickTiles")
const bluePickTiles = document.getElementById("bluePickTiles")
const banLines = document.querySelectorAll(".banLine")
const pickLines = document.querySelectorAll(".pickLine")
const sideBarMapSection = document.getElementById("sideBarMapSection")
let mappool, allBeatmaps
let resultsDisplayed = false
let currentPickedTile
let numBanTiles

// Pick removed event
let pickRemoved = false

let mappoolRequest = new XMLHttpRequest()
mappoolRequest.onreadystatechange = () => {
    if (mappoolRequest.readyState == XMLHttpRequest.DONE) {
        // beatmap info
        mappool = JSON.parse(mappoolRequest.responseText).record
        allBeatmaps = mappool.beatmaps

        for (let i = 0; i < allBeatmaps.length; i++) {
            // Make new button
            const mappoolButton = document.createElement("button")
            mappoolButton.setAttribute("id", allBeatmaps[i].beatmapID)
            mappoolButton.innerText = allBeatmaps[i].mod + allBeatmaps[i].order
            mappoolButton.classList.add("mappoolButton", "sideBarButton")
            mappoolButton.addEventListener("click", mapClickEvent)
            sideBarMapSection.append(mappoolButton)     
        }
        
        // Round name info
        const currentRoundName = mappool.roundName.toLowerCase()
        roundName.setAttribute("src",`../_shared/logo/static/${currentRoundName.replace(/ /g, "-")}.png`)

        // Get round information
        switch(currentRoundName) {
            case "round of 32": case "round of 16":
                currentBestOf = 9
                currentFirstTo = 5
                numBanTiles = 2
                banLines.forEach(banLine => banLine.style.height = "90px")
                pickLines.forEach(pickLine => pickLine.style.top = "238px")
                pickTiles.style.top = "238px"
                break
            case "quarterfinals":
                currentBestOf = 11
                currentFirstTo = 6
                numBanTiles = 2
                banLines.forEach(banLine => banLine.style.height = "90px")
                pickLines.forEach(pickLine => pickLine.style.top = "238px")
                pickTiles.style.top = "238px"
                break
            case "semifinals":
                currentBestOf = 11
                currentFirstTo = 6
                numBanTiles = 4
                break
            case "finals": case "grand finals":
                currentBestOf = 13
                currentFirstTo = 7
                numBanTiles = 4
                break
        }
        generateStarsDisplay("plus")

        // Cookies for best of
        document.cookie = `currentBestOf=${currentBestOf}; path=/`

        // Generate ban tiles
        for (let i = 0; i < numBanTiles; i++) {
            const mapInformationContainer = document.createElement("div")
            mapInformationContainer.classList.add("mapInformationContainer")

            const mapInformationBackgroundImage = document.createElement("div")
            mapInformationBackgroundImage.classList.add("mapInformationBackgroundImage")

            const mapInformationGradient = document.createElement("div")
            mapInformationGradient.classList.add("mapInformationGradient")

            const mapInformationModContainer = document.createElement("div")
            mapInformationModContainer.classList.add("mapInformationModContainer")

            const mapInformationModIdText = document.createElement("div")
            mapInformationModIdText.classList.add("mapInformationModIdText")

            const mapInformationModIdNumber = document.createElement("div")
            mapInformationModIdNumber.classList.add("mapInformationModIdNumber")

            const mapInformationSongName = document.createElement("div")
            mapInformationSongName.classList.add("mapInformationSongName")

            const mapInformationMapperText = document.createElement("div")
            mapInformationMapperText.innerText = "MAPPER"
            mapInformationMapperText.classList.add("mapInformationMapperText")

            const mapInformationMapperName = document.createElement("div")
            mapInformationMapperName.classList.add("mapInformationMapperName")

            const mapInformationDifficultyText = document.createElement("div")
            mapInformationDifficultyText.innerText = "DIFFICULTY"
            mapInformationDifficultyText.classList.add("mapInformationDifficultyText")

            const mapInformationDifficultyName = document.createElement("div")
            mapInformationDifficultyName.classList.add("mapInformationDifficultyName")

            const mapInformationPickerOverlay = document.createElement("div")
            mapInformationPickerOverlay.classList.add("mapInformationPickerOverlay")

            mapInformationModContainer.append(mapInformationModIdText, mapInformationModIdNumber)
            mapInformationContainer.append(mapInformationBackgroundImage, mapInformationGradient, mapInformationModContainer, 
                mapInformationSongName, mapInformationMapperText, mapInformationMapperName, mapInformationDifficultyText,
                mapInformationDifficultyName, mapInformationPickerOverlay)

            if (i % 2 === 0) {
                redBanTiles.append(mapInformationContainer)
            } else {
                blueBanTiles.append(mapInformationContainer)
            }  
        }

        // Generate pick tiles
        for (let i = 0; i < (currentFirstTo - 1) * 2; i++) {
            const mapInformationContainer = document.createElement("div")
            mapInformationContainer.classList.add("mapInformationContainer")

            const mapInformationBackgroundImage = document.createElement("div")
            mapInformationBackgroundImage.classList.add("mapInformationBackgroundImage")

            const mapInformationGradient = document.createElement("div")
            mapInformationGradient.classList.add("mapInformationGradient")

            const mapInformationModContainer = document.createElement("div")
            mapInformationModContainer.classList.add("mapInformationModContainer")

            const mapInformationModIdText = document.createElement("div")
            mapInformationModIdText.classList.add("mapInformationModIdText")

            const mapInformationModIdNumber = document.createElement("div")
            mapInformationModIdNumber.classList.add("mapInformationModIdNumber")

            const mapInformationSongName = document.createElement("div")
            mapInformationSongName.classList.add("mapInformationSongName")

            const mapInformationMapperText = document.createElement("div")
            mapInformationMapperText.innerText = "MAPPER"
            mapInformationMapperText.classList.add("mapInformationMapperText")

            const mapInformationMapperName = document.createElement("div")
            mapInformationMapperName.classList.add("mapInformationMapperName")

            const mapInformationDifficultyText = document.createElement("div")
            mapInformationDifficultyText.innerText = "DIFFICULTY"
            mapInformationDifficultyText.classList.add("mapInformationDifficultyText")

            const mapInformationDifficultyName = document.createElement("div")
            mapInformationDifficultyName.classList.add("mapInformationDifficultyName")

            const mapInformationPickerOverlay = document.createElement("div")
            mapInformationPickerOverlay.classList.add("mapInformationPickerOverlay")

            const mapInformationWinner = document.createElement("div")
            mapInformationWinner.classList.add("mapInformationWinner")

            const mapInformationWinnerText = document.createElement("div")
            mapInformationWinnerText.classList.add("mapInformationWinnerText")

            mapInformationModContainer.append(mapInformationModIdText, mapInformationModIdNumber)
            mapInformationContainer.append(mapInformationBackgroundImage, mapInformationGradient, mapInformationModContainer, 
                mapInformationSongName, mapInformationMapperText, mapInformationMapperName, mapInformationDifficultyText,
                mapInformationDifficultyName, mapInformationPickerOverlay, mapInformationWinner, mapInformationWinnerText)

            if (i % 2 === 0) {
                redPickTiles.append(mapInformationContainer)
            } else {
                bluePickTiles.append(mapInformationContainer)
            }   
        }
    }
}
mappoolRequest.open("GET", `https://api.jsonbin.io/v3/b/${mappoolJsonBinId}`, false)
mappoolRequest.setRequestHeader("X-Master-Key", jsonBinApiKey)
mappoolRequest.send()

// Find map
const findMapInMappool = beatmapID => {
    for (let i = 0; i < allBeatmaps.length; i++) {
        if (allBeatmaps[i].beatmapID == beatmapID) return allBeatmaps[i]
    }
    return
}

// Team Details
const redTeamNameText = document.getElementById("redTeamNameText")
const blueTeamNameText = document.getElementById("blueTeamNameText")
const redTeamBackgroundImage = document.getElementById("redTeamBackgroundImage")
const blueTeamBackgroundImage = document.getElementById("blueTeamBackgroundImage")
const redTeamAverageRankNumber = document.getElementById("redTeamAverageRankNumber")
const blueTeamAverageRankNumber = document.getElementById("blueTeamAverageRankNumber")
let currentTeamRedName, currentTeamBlueName

// Chat Section
const chatContainerDisplay = document.getElementById("chatContainerDisplay")
let chatLength = 0

// Score info
let currentScoreRed, currentScoreBlue
let currentRedCount
let currentBlueCount
let currentRedTotalAccuracy
let currentBlueTotalAccuracy
let currentRedAvgAccuracy
let currentBlueAvgAccuracy

const toggleAutopickText = document.getElementById("toggleAutopickText")
function autopickToggle() {
    if (toggleAutopickText.innerText === "ON") toggleAutopickText.innerText = "OFF"
    else toggleAutopickText.innerText = "ON"
}

// Room State
let currentRoomState
let previousRoomState

// Whenever socket sends a message
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    const message = data.message
    
    // Autopick with beatmap
    if (data.type === "Beatmap") {
        let hasAutopicked = false

        // If no map
        if (message.online_id === 0 || message.metadata.title === "no beatmaps available!") return
        // Find map
        let currentMap = findMapInMappool(message.online_id)
        // Autopick
        if (toggleAutopickText.innerText === "ON" && !document.contains(document.getElementById(`${message.online_id}-Pick`)) &&
        document.contains(document.getElementById(`${currentMap.beatmapID}`)) && sideBarNextActionText.innerText.includes("Pick") && currentMap) {
            hasAutopicked = true
            document.getElementById(currentMap.beatmapID).click()

            return
        }
        // If first picker is set
        if (!hasAutopicked && firstPicker && toggleAutopickText.innerText === "ON") {
            let currentTileContainer
            if (firstPicker === "red") currentTileContainer = redPickTiles
            else if (firstPicker === "blue") currentTileContainer = bluePickTiles

            // If no first picker
            if (!currentTileContainer) return

            // Find the tile
            let currentAutopickTile
            for (let i = 0; i < currentTileContainer.childElementCount; i++) {
                if (currentTileContainer.children[i].hasAttribute("id")) continue
                currentAutopickTile = currentTileContainer.children[i]
                setTile(currentAutopickTile, currentMap, "Pick")
                break
            }
        }
    }

    // Team details changing
    if (data.type === "MultiplayerRoomState") {
        /**
         * @typedef {{
         *     room_name: string
         *     room_state: string
         * }} message
         */

        previousRoomState = currentRoomState
        currentRoomState = message.room_state

        if (currentRoomState == "Results" && !resultsDisplayed && !warmupMode) {
            if (sideBarNextActionText.innerText !== "") changeNextAction(sideBarNextActionText.innerText.split(" ")[0], sideBarNextActionText.innerText.split(" ")[1])
            resultsDisplayed = true

            // Add block to winner
            if (currentPickedTile) {
                currentPickedTile.children[9].style.display = "none"
                currentPickedTile.children[9].classList.remove("mapInformationWinnerRed")
                currentPickedTile.children[9].classList.remove("mapInformationWinnerBlue")
                if (currentScoreRed > currentScoreBlue) {
                    currentPickedTile.children[9].style.display = "block"
                    currentPickedTile.children[9].classList.add("mapInformationWinnerRed")
                    currentPickedTile.children[10].innerText = "red"
                } else if (currentScoreBlue > currentScoreRed) {
                    currentPickedTile.children[9].style.display = "block"
                    currentPickedTile.children[9].classList.add("mapInformationWinnerBlue")
                    currentPickedTile.children[10].innerText = "blue"
                } else if (currentRedAvgAccuracy > currentBlueAvgAccuracy) {
                    currentPickedTile.children[9].style.display = "block"
                    currentPickedTile.children[9].classList.add("mapInformationWinnerRed")
                    currentPickedTile.children[10].innerText = "red"
                } else if (currentBlueAvgAccuracy > currentRedAvgAccuracy) {
                    currentPickedTile.children[9].style.display = "block"
                    currentPickedTile.children[9].classList.add("mapInformationWinnerBlue")
                    currentPickedTile.children[10].innerText = "blue"
                }
            }

            // Set match winner
            setTimeout(() => {
                if ((currentStarRed === currentFirstTo || currentStarBlue === currentFirstTo) && enableAutoAdvance) {
                    obsGetCurrentScene((scene) => {
                        if (scene.name === team_win_scene_name) return
                        obsSetCurrentScene(team_win_scene_name)
                    })
                }
            }, 20000)
        } else if (currentRoomState == "Open") {
            // Transition to mappool screen
            obsGetCurrentScene((scene) => {
                if (scene.name !== gameplay_scene_name && scene.name !== idle_scene_name) return
                if (enableAutoAdvance && previousRoomState === "Results" && !warmupMode) obsSetCurrentScene(mappool_scene_name)
                else obsSetCurrentScene(idle_scene_name)
            })
            resultsDisplayed = false
        } else if (currentRoomState == "WaitingForLoad" || currentRoomState === "Playing") {
            // Transition to gameplay scene
            obsGetCurrentScene((scene) => {
                if (scene.name === gameplay_scene_name) return
                obsSetCurrentScene(gameplay_scene_name)
            })
            resultsDisplayed = false
        }
    }

    // Chat messages
    if (data.type === "MultiplayerChatState") {
        /**
         * @typedef {{
        *     chat_messages: {
        *         number: {
        *             message_content: string
        *             message_time: datetime
        *             sender_name: string
        *             team_id: number
        *         }
        *     }
        * }} message
        */

        if (chatLength !== message.chat_messages.length) {
            (chatLength === 0 || chatLength > message.chat_messages.length) ? (chatContainerDisplay.innerHTML = "", chatLEngth = 0) : null

            for (let i = chatLength; i < message.chat_messages.length; i++) {
                // TODO: Add teams to chat messages
                let currentClass = "unknownTeamChat"
                if (message.chat_messages[i].team_id === 0) {
                    currentClass = "redTeamChat"
                } else if (message.chat_messages[i].team_id === 1) {
                    currentClass = "blueTeamChat"
                }

                // Container
                const chatMessageContainer = document.createElement("div")
                chatMessageContainer.classList.add("chatMessageContainer")

                // Time
                let dateTime = new Date(Date.parse(message.chat_messages[i].message_time))
                const messageTime = document.createElement("div")
                messageTime.classList.add("messageTime")
                messageTime.innerText = `${dateTime.getUTCHours().toString().padStart(2, '0')}:${dateTime.getUTCMinutes().toString().padStart(2, '0')}`

                // Name
                const messageUser = document.createElement("div")
                messageUser.classList.add("messageUser", currentClass)
                messageUser.innerText = message.chat_messages[i].sender_name

                // Content
                const messageContent = document.createElement("div")
                messageContent.classList.add("messageContent", currentClass)
                messageContent.innerText = message.chat_messages[i].message_content

                chatMessageContainer.append(messageTime, messageUser, messageContent)
                chatContainerDisplay.append(chatMessageContainer)
            }

            chatContainerDisplay.scrollTop = chatContainerDisplay.scrollHeight;
        }
    }

    if (data.type === "MultiplayerGameplay") {
        /**
         * @typedef {{
         *     player_states: {
         *         string: {
         *             team_id: number
         *             total_score: number
         *             username: string
         *             user_id: number
         *             slot_index: number
         *             accuracy: number
         *             mods: [{}]
         *             combo: number
         *             highest_combo: number
         *             user_state: string
         *         }
         *     }
         * }} message
         */

        currentScoreRed = 0
        currentScoreBlue = 0

        currentRedCount = 0
        currentBlueCount = 0
        currentRedTotalAccuracy = 0
        currentBlueTotalAccuracy = 0
        currentRedAvgAccuracy = 0
        currentBlueAvgAccuracy = 0

        // Check for gameplay and whether results are displayed
        for (let key in message.player_states) {
            const player = message.player_states[key]
            const score = player.total_score
            const accuracy = player.accuracy

            if (player.team_id === 0) {
                currentScoreRed += parseInt(score)
                currentRedTotalAccuracy += accuracy
                currentRedCount++
            } else if (player.team_id === 1) {
                currentScoreBlue += parseInt(score)
                currentBlueTotalAccuracy += accuracy
                currentBlueCount++
            }
        }

        // Set average accuracies
        currentRedAvgAccuracy = currentRedTotalAccuracy / currentRedCount
        currentBlueAvgAccuracy = currentBlueTotalAccuracy / currentBlueCount
    }
}

function updateTeamDisplay(team, backgroundElement, averageRankElement, playerPrefix) {
    backgroundElement.style.backgroundImage = `url("${team.banner_url}")`;
    averageRankElement.innerText = Math.round(team.player_ranks.reduce((acc, val) => acc + val, 0) / team.player_ranks.length).toLocaleString();

    for (let j = 0; j < 5; j++) {
        const playerElement = document.getElementById(`${playerPrefix}${j + 1}`);
        if (j < team.player_ids.length) {
            playerElement.style.display = "block";
            playerElement.children[1].setAttribute("src", `https://a.ppy.sh/${team.player_ids[j]}`);
            playerElement.children[3].innerText = team.player_names[j];
            playerElement.children[5].innerText = `#${team.player_ranks[j].toLocaleString()}`;
        } else {
            playerElement.style.display = "none";
        }
    }
}

// Change next action
const sideBarNextActionText = document.getElementById("sideBarNextActionText")
function changeNextAction(colour, action) {
    // Change text
    sideBarNextActionText.innerText = `${colour} ${action}`

    // Remove all animations
    function removeAllTileAnimations(tiles) {
        for (let i = 0; i < tiles.childElementCount; i++) {
            tiles.children[i].children[8].classList.remove("mapInformationPickerCurrent")
            tiles.children[i].children[8].innerText = ""
            tiles.children[i].children[8].previousElementSibling.classList.remove("mapInformationPickerCurrent")
            tiles.children[i].children[8].previousElementSibling.innerText = ""

        }
    }
    removeAllTileAnimations(redBanTiles)
    removeAllTileAnimations(blueBanTiles)
    removeAllTileAnimations(redPickTiles)
    removeAllTileAnimations(bluePickTiles)

    // Function to add class to the appropriate tile
    function handleAction(tiles) {
        if (tiles === tiebreakerContainer) {
            const targetElement = tiles.children[8]
            targetElement.classList.add("mapInformationPickerCurrent")
            return
        }
        for (let i = 0; i < tiles.childElementCount; i++) {
            const tile = tiles.children[i]
            if (tile.hasAttribute("id")) continue
            const targetElement = tile.children[8]
            targetElement.classList.add("mapInformationPickerCurrent")
            if (tiles === redBanTiles || tiles === blueBanTiles) targetElement.innerText = "BANNING..."
            else targetElement.innerText = "PICKING..."
            break
        }
    }

    if (action === "Pick" && colour === "Tiebreaker") {
        // Tiebreaker
        handleAction(tiebreakerContainer)
    } else if (action === "Ban" && colour === "Red") {
        // Red Ban
        handleAction(redBanTiles)
    } else if (action === "Ban" && colour === "Blue") {
        // Blue Ban
        handleAction(blueBanTiles)
    } else if (action === "Pick" && colour === "Red") {
        // Red Pick
        handleAction(redPickTiles)
    } else if (action === "Pick" && colour === "Blue") {
        // Blue Pick
        handleAction(bluePickTiles)
    }
}
changeNextAction("Red", "Ban")

const redTeamProtectMap = document.getElementById("redTeamProtectMap")
const blueTeamProtectMap = document.getElementById("blueTeamProtectMap")
// Set Protects
function setProtect(mapInformationElement, currentBeatmap) {
    const currentMod = currentBeatmap.mod
    mapInformationElement.style.display = "block"
    mapInformationElement.style.color = `var(--${currentMod}Colour)`
    mapInformationElement.children[0].style.backgroundImage = `url("${currentBeatmap.imgURL}")`
    mapInformationElement.children[2].style.backgroundColor = `var(--${currentMod}Colour)`
    mapInformationElement.children[2].children[0].innerText = currentMod
    mapInformationElement.children[2].children[1].innerText = currentBeatmap.order
    mapInformationElement.children[3].innerText = currentBeatmap.songName
    mapInformationElement.children[5].innerText = currentBeatmap.mapper
    mapInformationElement.children[7].innerText = currentBeatmap.difficultyname
}
// Set Tile
function setTile(currentTile, currentBeatmap, type) {
    const currentMod = currentBeatmap.mod

    // Check for tiebreaker
    if (currentMod === "TB") { currentTile = tiebreakerContainer }

    currentTile.setAttribute("id", `${currentBeatmap.beatmapID}-${type}`)
    currentTile.style.color = `var(--${currentMod}Colour)`
    currentTile.style.boxShadow = `var(--boxShadow${currentMod})`
    currentTile.children[0].style.backgroundImage = `url("${currentBeatmap.imgURL}")`
    currentTile.children[2].style.backgroundColor = `var(--${currentMod}Colour)`
    currentTile.children[2].children[0].innerText = currentMod
    currentTile.children[2].children[1].innerText = currentBeatmap.order
    currentTile.children[3].innerText = currentBeatmap.songName
    currentTile.children[5].innerText = currentBeatmap.mapper
    currentTile.children[7].innerText = currentBeatmap.difficultyname
    currentTile.children[8].style.display = "none"
    return 
}
function setBan(banTiles, currentBeatmap) {
    let currentTile
    if (banTiles.children[0].hasAttribute("id")) currentTile = banTiles.children[1]
    else currentTile = banTiles.children[0]

    if (document.contains(document.getElementById(`${currentBeatmap.beatmapID}-Ban`))) return
    setTile(currentTile, currentBeatmap, "Ban")
    return "Ban has been set"
}

// First picker
const sideBarFirstPickerText = document.getElementById("sideBarFirstPickerText")
let firstPicker
// Check first picker
function checkFirstPicker() {
    let numRedPicks = 0
    let numBluePicks = 0

    // Check red picks
    for (let i = 0; i < redPickTiles.childElementCount; i++) {
        if (window.getComputedStyle(redPickTiles.children[i].children[8]).display === "none") numRedPicks++
    }
    
    // Check blue picks
    for (let i = 0; i < bluePickTiles.childElementCount; i++) {
        if (window.getComputedStyle(bluePickTiles.children[i].children[8]).display === "none") numBluePicks++
    }

    // Go through all checks
    if (numRedPicks > 1) return
    if (numBluePicks > 1) return
    if (numRedPicks + numBluePicks > 1) return
    if (window.getComputedStyle(tiebreakerContainer.children[8]).display === "none") return

    // Set first picker
    if (numRedPicks === 1) setFirstPicker("red")
    else if (numBluePicks === 1) setFirstPicker("blue")
}
// set first picker
function setFirstPicker(colour) {
    firstPicker = colour
    if (colour === "") sideBarFirstPickerText.innerText = ``
    else sideBarFirstPickerText.innerText = `${firstPicker.charAt(0).toUpperCase() + firstPicker.slice(1)} First Pick`

    document.cookie = `firstPicker=${firstPicker}; path=/`
}

// Map click event
function mapClickEvent() {
    const currentId = this.id
    const currentBeatmap = findMapInMappool(currentId)

    if (sideBarNextActionText.innerText === "Red Protect") {
        setProtect(redTeamProtectMap, currentBeatmap)
    } else if (sideBarNextActionText.innerText === "Blue Protect") {
        setProtect(blueTeamProtectMap, currentBeatmap)
    }

    // Bans
    let message
    if (sideBarNextActionText.innerText === "Red Ban") {
        message = setBan(redBanTiles, currentBeatmap)
    } else if (sideBarNextActionText.innerText === "Blue Ban") {
        message = setBan(blueBanTiles, currentBeatmap)
    }

    // Picks
    function setPicks(pickTiles) {
        let currentTile
        for (let i = 0; i < pickTiles.childElementCount; i++) {
            if (pickTiles.children[i].hasAttribute("id")) continue
            currentTile = pickTiles.children[i]
            break
        }

        if (document.contains(document.getElementById(`${currentId}-Pick`))) return
        if (currentBeatmap.mod === "TB") currentTile = tiebreakerContainer
        if (currentTile === undefined) return

        setTile(currentTile, currentBeatmap, "Pick")
        currentPickedTile = currentTile

        // set pick removed
        pickRemoved = false

        setTimeout(() => {
            if (enableAutoAdvance) {
                obsGetCurrentScene((scene) => {
                    if ((currentRoomState === "WaitingForLoad" || currentRoomState === "Playing") && !pickRemoved) {
                        obsSetCurrentScene(gameplay_scene_name)
                    } else if (!pickRemoved) {
                        obsSetCurrentScene(idle_scene_name)
                    }
                })
            }
        }, 10000)

        return "Pick has been set"
    }
    if (sideBarNextActionText.innerText === "Red Pick") {
        message = setPicks(redPickTiles)
        checkFirstPicker()
        document.cookie = "currentPicker=redPicker; path=/"
    } else if (sideBarNextActionText.innerText === "Blue Pick") {
        message = setPicks(bluePickTiles)
        checkFirstPicker()
        document.cookie = "currentPicker=bluePicker; path=/"
    }

    if (!message) return

    // Set new picks
    if (sideBarNextActionText.innerText === "Red Pick") sideBarNextActionText.innerText = "Blue Pick"
    else if (sideBarNextActionText.innerText === "Blue Pick") sideBarNextActionText.innerText = "Red Pick"

    // Set new bans
    const banNumber = banCounter()
    if (sideBarNextActionText.innerText === "Blue Ban" && banNumber === 1) changeNextAction("Red", "Ban")
    else if (sideBarNextActionText.innerText === "Red Ban" && banNumber === 1) changeNextAction("Blue", "Ban")
    if (numBanTiles === 4) {
        if (sideBarNextActionText.innerText === "Blue Ban" && banNumber === 2) changeNextAction("Blue", "Ban")
        else if (sideBarNextActionText.innerText === "Red Ban" && banNumber === 2) changeNextAction("Red", "Ban")
        else if (sideBarNextActionText.innerText === "Blue Ban" && banNumber === 3) changeNextAction("Red", "Ban")
        else if (sideBarNextActionText.innerText === "Red Ban" && banNumber === 3) changeNextAction("Blue", "Ban")
    }

    // Set new protects
    if (sideBarNextActionText.innerText === "Red Protect") changeNextAction("Blue", "Protect")
    else if (sideBarNextActionText.innerText === "Blue Protect") changeNextAction("Red", "Protect")
}
function banCounter() {
    let banCounter = 0
    for (let i = 0; i < redBanTiles.childElementCount; i++) {
        if (redBanTiles.children[i].hasAttribute("id")) banCounter++
        if (blueBanTiles.children[i].hasAttribute("id")) banCounter++
    }
    return banCounter
}

// Map Management
const sideBarMapManagement = document.getElementById("sideBarMapManagement")
const sideBarChooseActionSelect = document.getElementById("sideBarChooseActionSelect")
let currentAction
function sideBarChooseActionSelectValueChange() {
    currentAction = sideBarChooseActionSelect.value

    // Reset everything 
    pickManagementCurrentAction = undefined
    pickManagementCurrentMap = undefined
    pickManagementChooseWinnerMap = undefined

    while (sideBarMapManagement.childElementCount > 2) {
        sideBarMapManagement.removeChild(sideBarMapManagement.lastElementChild)
    }

    function createSelectOptions(innerText, value) {
        const selectOption = document.createElement("option")
        selectOption.innerText = innerText
        selectOption.setAttribute("value", value)
        return selectOption
    }
    
    if (currentAction === "setProtect" || currentAction === "removeProtect") {
        sideBarMapManagement.append(createSectionSideHeader("protect"))

        // Append select options
        const sideBarChooseProtectSelect = document.createElement("select")
        sideBarChooseProtectSelect.classList.add("sideBarSelect")
        sideBarChooseProtectSelect.setAttribute("onchange", "sideBarChooseSelectValueChange()")
        sideBarChooseProtectSelect.setAttribute("id", "sideBarChooseProtectSelect")
        sideBarChooseProtectSelect.setAttribute("size", 2)

        // Append select options
        sideBarChooseProtectSelect.append(createSelectOptions("Red Protect", "redProtect"))
        sideBarChooseProtectSelect.append(createSelectOptions("Blue Protect", "blueProtect"))
        sideBarMapManagement.append(sideBarChooseProtectSelect)

        // Just for getting maps in
        if (currentAction === "setProtect") {
            sideBarMapManagement.append(pickManagementCreateSelectMaps())
        }
    }

    // Bans
    if (currentAction === "setBan" || currentAction === "removeBan") {
        sideBarMapManagement.append(createSectionSideHeader("ban"))

        // Append select options
        const sideBarChooseBanSelect = document.createElement("select")
        sideBarChooseBanSelect.classList.add("sideBarSelect")
        sideBarChooseBanSelect.setAttribute("onchange", "sideBarChooseSelectValueChange()")
        sideBarChooseBanSelect.setAttribute("id", "sideBarChooseProtectSelect")
        sideBarChooseBanSelect.setAttribute("size", 4)

        // Append select options
        sideBarChooseBanSelect.append(createSelectOptions("Red Ban 1", "redBan1"))
        sideBarChooseBanSelect.append(createSelectOptions("Blue Ban 1", "blueBan1"))
        sideBarChooseBanSelect.append(createSelectOptions("Red Ban 2", "redBan2"))
        sideBarChooseBanSelect.append(createSelectOptions("Blue Ban 2", "blueBan2"))
        sideBarMapManagement.append(sideBarChooseBanSelect)

        // Just for getting maps in
        if (currentAction === "setBan") {
            sideBarMapManagement.append(pickManagementCreateSelectMaps())
        }
    }

    // Picks
    if (currentAction === "setPick" || currentAction === "removePick") {
        sideBarMapManagement.append(createSectionSideHeader("pick"))

        // Append select options
        const sideBarChoosePickSelect = document.createElement("select")
        sideBarChoosePickSelect.classList.add("sideBarSelect")
        sideBarChoosePickSelect.setAttribute("onchange", "sideBarChooseSelectValueChange()")
        sideBarChoosePickSelect.setAttribute("id", "sideBarChooseProtectSelect")
        
        for (let i = 0; i < redPickTiles.childElementCount; i++) {
            sideBarChoosePickSelect.append(createSelectOptions(`Red pick ${i + 1}`, `redPick${i + 1}`))
            sideBarChoosePickSelect.append(createSelectOptions(`Blue pick ${i + 1}`, `bluePick${i + 1}`))
        }
        sideBarChoosePickSelect.append(createSelectOptions("Tiebreaker", "tiebreaker"))
        sideBarChoosePickSelect.setAttribute("size", sideBarChoosePickSelect.childElementCount)
        sideBarMapManagement.append(sideBarChoosePickSelect)
        sideBarChooseSelectValueChange()

        // Just for getting maps in
        if (currentAction === "setPick") {
            sideBarMapManagement.append(pickManagementCreateSelectMaps())
        }
    }

    // Winner
    if (currentAction === "setWinner" || currentAction === "removeWinner") {
        // Set winner only
        if (currentAction === "setWinner") {
            // Which team's win
            sideBarMapManagement.append(createSectionSideHeader("win"))
            // Append select options
            const sideBarChooseWinnerSelect = document.createElement("select")
            sideBarChooseWinnerSelect.classList.add("sideBarSelect")
            sideBarChooseWinnerSelect.setAttribute("onchange", "sideBarChooseSelectWinnerMapValueChange()")
            sideBarChooseWinnerSelect.setAttribute("id", "sideBarChooseWinnerSelect")
            sideBarChooseWinnerSelect.setAttribute("size", 2)
            // append options
            sideBarChooseWinnerSelect.append(createSelectOptions(`Red Team`, `redTeam`))
            sideBarChooseWinnerSelect.append(createSelectOptions(`Blue Team`, `blueTeam`))
            sideBarMapManagement.append(sideBarChooseWinnerSelect)
        }

        // Which team's map
        sideBarMapManagement.append(createSectionSideHeader("map"))
        // Append select options
        const sideBarChooseWinnerMapSelect = document.createElement("select")
        sideBarChooseWinnerMapSelect.classList.add("sideBarSelect")
        sideBarChooseWinnerMapSelect.setAttribute("onchange", "sideBarChooseSelectValueChange()")
        sideBarChooseWinnerMapSelect.setAttribute("id", "sideBarChooseProtectSelect")
        
        for (let i = 0; i < redPickTiles.childElementCount; i++) {
            sideBarChooseWinnerMapSelect.append(createSelectOptions(`Red pick ${i + 1}`, `redPick${i + 1}`))
            sideBarChooseWinnerMapSelect.append(createSelectOptions(`Blue pick ${i + 1}`, `bluePick${i + 1}`))
        }
        sideBarChooseWinnerMapSelect.append(createSelectOptions("Tiebreaker", "tiebreaker"))
        sideBarChooseWinnerMapSelect.setAttribute("size", sideBarChooseWinnerMapSelect.childElementCount)
        sideBarMapManagement.append(sideBarChooseWinnerMapSelect)
        sideBarChooseSelectValueChange()
    }

    // Append apply changes button
    if (currentAction) {
        sideBarMapManagement.append()
        const applyChangesButton = document.createElement("button")
        applyChangesButton.classList.add("sideBarButton", "sideBarNextActionButton", "sideBarButtonFullWidth")
        applyChangesButton.innerText = "APPLY CHANGES"

        // Apply function dependning on what currentAction is
        switch (currentAction) {
            case "setProtect": applyChangesButton.addEventListener("click", applyChangesSetProtect); break;
            case "removeProtect": applyChangesButton.addEventListener("click", applyChangesRemoveProtect); break;
            case "setBan": applyChangesButton.addEventListener("click", applyChangesSetBan); break;
            case "removeBan": applyChangesButton.addEventListener("click", applyChangesRemoveBan); break;
            case "setPick": applyChangesButton.addEventListener("click", applyChangesSetPick); break;
            case "removePick": applyChangesButton.addEventListener("click", applyChangesRemovePick); break;
            case "setWinner": applyChangesButton.addEventListener("click", applyChangesSetWinner); break;
            case "removeWinner": applyChangesButton.addEventListener("click", applyChangesRemoveWinner); break;
        }
        applyChangesButton.addEventListener("click", applyChangesSetProtect)
        sideBarMapManagement.append(applyChangesButton)
    }
}
// Create section side header
function createSectionSideHeader(action) {
    const sideBarSectionHeader = document.createElement("div")
    sideBarSectionHeader.innerText = `Which team's ${action}?`
    sideBarSectionHeader.classList.add("sideBarSectionHeader")
    return sideBarSectionHeader
}
// Create elements to select maps
function pickManagementCreateSelectMaps() {
    // Append header
    const sideBarMapsHeader = document.createElement("div")
    sideBarMapsHeader.innerText = "Which map?"
    sideBarMapsHeader.classList.add("sideBarSectionHeader")
    sideBarMapManagement.append(sideBarMapsHeader)
    // Append Container
    const setPickManagementMaps = document.createElement("div")
    setPickManagementMaps.classList.add("setPickManagementMaps")
    // Append maps
    for (let i = 0; i < allBeatmaps.length; i++) {
        const setBanMapButton = document.createElement("button")
        setBanMapButton.classList.add("pickManagementSetMapButton")
        setBanMapButton.setAttribute("onclick", `pickManagementSetCurrentMap(${allBeatmaps[i].beatmapID})`)
        setBanMapButton.setAttribute("id",`${allBeatmaps[i].beatmapID}-pickManagementSetMapButton`)
        setBanMapButton.innerText = allBeatmaps[i].mod + allBeatmaps[i].order
        setPickManagementMaps.append(setBanMapButton)
    }
    return setPickManagementMaps
}
// Capture value of setProtect
let pickManagementCurrentAction
function sideBarChooseSelectValueChange() {
    const sideBarChooseProtectSelect = document.getElementById("sideBarChooseProtectSelect")
    pickManagementCurrentAction = sideBarChooseProtectSelect.value
}
// Capture value of pick for setWinner
let pickManagementChooseWinnerMap
function sideBarChooseSelectWinnerMapValueChange() {
    const sideBarChooseWinnerSelect = document.getElementById("sideBarChooseWinnerSelect")
    pickManagementChooseWinnerMap = sideBarChooseWinnerSelect.value
}
// Capture value of setcurrentmap
const pickManagementSetMapButtons = document.getElementsByClassName("pickManagementSetMapButton")
let pickManagementCurrentMap
function pickManagementSetCurrentMap(beatmapID) {
    for (let i = 0; i < pickManagementSetMapButtons.length; i++) {
        pickManagementSetMapButtons[i].style.backgroundColor = "transparent"
    }
    const pickManagementSetMapButton = document.getElementById(`${beatmapID}-pickManagementSetMapButton`)
    if (document.contains(pickManagementSetMapButton)) {
        pickManagementSetMapButton.style.backgroundColor = "rgb(206,206,206)"
    }
    pickManagementCurrentMap = beatmapID
}
// Apply changes for setProtect
function applyChangesCheckProtect() {
    if (pickManagementCurrentAction === "redProtect") return redTeamProtectMap
    else if (pickManagementCurrentAction === "blueProtect") return blueTeamProtectMap
    return 
}
function applyChangesSetProtect() {
    if (!pickManagementCurrentAction || !pickManagementCurrentMap) return
    
    const currentMap = findMapInMappool(pickManagementCurrentMap)
    const currentProtectMapElement = applyChangesCheckProtect()
    if (!currentProtectMapElement || !currentMap) return

    setProtect(currentProtectMapElement, currentMap)
}
// Apply changes for removeProtect
function applyChangesRemoveProtect() {
    if (!pickManagementCurrentAction) return

    const currentProtectMapElement = applyChangesCheckProtect()
    if (!currentProtectMapElement) return

    currentProtectMapElement.style.display = "none"
}
// Check bans
function applyChangesCheckBan() {
    let currentTile
    switch (pickManagementCurrentAction) {
        case "redBan1": currentTile = redBanTiles.children[0]; break;
        case "redBan2": currentTile = redBanTiles.children[1]; break;
        case "blueBan1": currentTile = blueBanTiles.children[0]; break;
        case "blueBan2": currentTile = blueBanTiles.children[1]; break;
    }
    return currentTile
}
// Apply changes for setBan
function applyChangesSetBan() {
    if (!pickManagementCurrentAction || !pickManagementCurrentMap) return

    const currentMap = findMapInMappool(pickManagementCurrentMap)
    const currentTile = applyChangesCheckBan()
    if (!currentTile || !currentMap) return

    setTile(currentTile, currentMap, "Ban")
}
// Apply changes for removeBan
function applyChangesRemoveBan() {
    if (!pickManagementCurrentAction) return

    const currentTile = applyChangesCheckBan()
    if (!currentTile) return

    currentTile.removeAttribute("id")
    currentTile.style.boxShadow = "none"
    currentTile.children[8].style.display = "block"
}
// Apply changes for setPick
function applyChangesCheckPick() {
    // See if tile is possible
    let possiblePickManagementCurrentActions = []
    for (let i = 0; i < redPickTiles.childElementCount; i++) {
        possiblePickManagementCurrentActions.push(`redPick${i + 1}`)
        possiblePickManagementCurrentActions.push(`bluePick${i + 1}`)
    }
    possiblePickManagementCurrentActions.push("tiebreaker")
    
    let arrayIndex = possiblePickManagementCurrentActions.indexOf(pickManagementCurrentAction)
    if (arrayIndex === -1) return
    
    // Find correct tile
    let tileContainer
    let currentTile
    if (arrayIndex === possiblePickManagementCurrentActions.length - 1) currentTile = tiebreakerContainer
    else if (arrayIndex % 2 === 0) tileContainer = redPickTiles
    else if (arrayIndex % 2 === 1) {
        tileContainer = bluePickTiles
        arrayIndex--
    }

    if (currentTile !== tiebreakerContainer) currentTile = tileContainer.children[Math.floor(arrayIndex / 2)]
    if (!currentTile) return

    return currentTile
}
function applyChangesSetPick() {
    if (!pickManagementCurrentAction || !pickManagementCurrentMap) return

    // Find tile
    const currentTile = applyChangesCheckPick()
    if (!currentTile) return

    // Find map
    const currentBeatmap = findMapInMappool(pickManagementCurrentMap)
    if (!currentBeatmap) return

    // Set Tile
    setTile(currentTile, currentBeatmap, "Pick")
}
// Apply changes for removePick
function applyChangesRemovePick() {
    if (!pickManagementCurrentAction) return

    // Find tile
    const currentTile = applyChangesCheckPick()
    if (!currentTile) return

    // set pick removed
    pickRemoved = true

    // Do actions
    currentTile.removeAttribute("id")
    currentTile.style.boxShadow = "none"
    currentTile.children[8].style.display = "block"
    currentTile.children[9].style.display = "none"
    currentTile.children[10].innerText = ""
}

// Apply changes for setWinner
function applyChangesSetWinner() {
    if (!pickManagementCurrentAction || !pickManagementChooseWinnerMap) return
    // Find tile
    const currentTile = applyChangesCheckPick()
    if (!currentTile) return
    // Find winner
    if (pickManagementChooseWinnerMap !== "redTeam" && pickManagementChooseWinnerMap !== "blueTeam") return

    // Set winner
    currentTile.children[9].classList.remove("mapInformationWinnerRed")
    currentTile.children[9].classList.remove("mapInformationWinnerBlue")
    currentTile.children[9].style.display = "block"
    currentTile.children[10].innerText = pickManagementChooseWinnerMap == "redTeam"? "red": "blue"
    
    if (pickManagementChooseWinnerMap === "redTeam") currentTile.children[9].classList.add("mapInformationWinnerRed")
    else currentTile.children[9].classList.add("mapInformationWinnerBlue")
}
// Apply changes for removeWinner
function applyChangesRemoveWinner() {
    if (!pickManagementCurrentAction) return

    // Find tile
    const currentTile = applyChangesCheckPick()
    if (!currentTile) return

    // Remove winner
    currentTile.children[9].classList.remove("mapInformationWinnerRed")
    currentTile.children[9].classList.remove("mapInformationWinnerBlue")
    currentTile.children[9].style.display = "none"
    currentTile.children[10].innerText = ""
}

// Get Cookie
function getCookie(cname) {
    let name = cname + "="
    let ca = document.cookie.split(';')
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') c = c.substring(1)
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}


// Warmup
let warmupMode
const warmupText = document.getElementById("warmupText")
function warmupToggle() {
    warmupMode = !warmupMode
    document.cookie = `warmupMode=${warmupMode}; path=/`
    warmupCheck()
}
function warmupCheck() {
    if (warmupMode) warmupText.innerText = "ON"
    else warmupText.innerText = "OFF"
}

setInterval(() => {
    // Get warmup mode
    warmupMode = (getCookie("warmupMode") == "true") ? true : false
    warmupCheck()

    // Display stars
    currentStarRed = parseInt(getCookie("currentStarRed"))
    currentStarBlue = parseInt(getCookie("currentStarBlue"))
    generateStarsDisplay("plus")

    // Set array required for map ids in winner screen
    let mapIds = []
    if (firstPicker === "red") {
        for (let i = 0; i < redPickTiles.childElementCount; i++) {
            const redPickTileElement = redPickTiles.children[i]
            const bluePickTileElement = bluePickTiles.children[i]
            const redPickTileElementMod = redPickTileElement.children[2]
            const bluePickTileElementMod = bluePickTileElement.children[2]

            if (window.getComputedStyle(redPickTileElement.children[8]).display === "none") {
                mapIds.push(`${redPickTileElementMod.children[0].innerText}${redPickTileElementMod.children[1].innerText}`)
            }
            if (window.getComputedStyle(bluePickTileElement.children[8]).display === "none") {
                mapIds.push(`${bluePickTileElementMod.children[0].innerText}${bluePickTileElementMod.children[1].innerText}`)
            }
        }
        if (window.getComputedStyle(tiebreakerContainer.children[8]).display === "none") mapIds.push("TB")

        document.cookie = `mapIds=${JSON.stringify(mapIds)}; path=/`
    } else if (firstPicker === "blue") {
        for (let i = 0; i < redPickTiles.childElementCount; i++) {
            const redPickTileElement = redPickTiles.children[i]
            const bluePickTileElement = bluePickTiles.children[i]
            const redPickTileElementMod = redPickTileElement.children[2]
            const bluePickTileElementMod = bluePickTileElement.children[2]

            if (window.getComputedStyle(bluePickTileElement.children[8]).display === "none") {
                mapIds.push(`${bluePickTileElementMod.children[0].innerText}${bluePickTileElementMod.children[1].innerText}`)
            }
            if (window.getComputedStyle(redPickTileElement.children[8]).display === "none") {
                mapIds.push(`${redPickTileElementMod.children[0].innerText}${redPickTileElementMod.children[1].innerText}`)
            }
        }
        if (window.getComputedStyle(tiebreakerContainer.children[8]).display === "none") mapIds.push("TB")

        document.cookie = `mapIds=${JSON.stringify(mapIds)}; path=/`
    }
    
    // Set array required for winner colours in winner screen
    let mapWinners = []
    if (firstPicker === "red") {
        for (let i = 0; i < redPickTiles.childElementCount; i++) {
            const redPickTileElement = redPickTiles.children[i]
            const bluePickTileElement = bluePickTiles.children[i]

            if (redPickTileElement.children[10].innerText === "red") mapWinners.push("red")
            else if (redPickTileElement.children[10].innerText === "blue") mapWinners.push("blue")

            if (bluePickTileElement.children[10].innerText === "red") mapWinners.push("red")
            else if (bluePickTileElement.children[10].innerText === "blue") mapWinners.push("blue")
        }

        if (tiebreakerContainer.children[10].innerText === "red") mapWinners.push("red")
        else if (tiebreakerContainer.children[10].innerText === "blue") mapWinners.push("blue")

        document.cookie = `mapWinners=${JSON.stringify(mapWinners)}; path=/`
    } else if (firstPicker === "blue") {
        for (let i = 0; i < redPickTiles.childElementCount; i++) {
            const redPickTileElement = redPickTiles.children[i]
            const bluePickTileElement = bluePickTiles.children[i]

            if (bluePickTileElement.children[10].innerText === "red") mapWinners.push("red")
            else if (bluePickTileElement.children[10].innerText === "blue") mapWinners.push("blue")

            if (redPickTileElement.children[10].innerText === "red") mapWinners.push("red")
            else if (redPickTileElement.children[10].innerText === "blue") mapWinners.push("blue")
        }

        if (tiebreakerContainer.children[10].innerText === "red") mapWinners.push("red")
        else if (tiebreakerContainer.children[10].innerText === "blue") mapWinners.push("blue")

        document.cookie = `mapWinners=${JSON.stringify(mapWinners)}; path=/`
    }

    // Team Name
    currentTeamRedName = getCookie("currentRedTeamName")
    currentTeamBlueName = getCookie("currentBlueTeamName")
    redTeamNameText.innerText = currentTeamRedName
    blueTeamNameText.innerText = currentTeamBlueName

    for (let i = 0; i < allPlayers.length; i++) {
        if (currentTeamRedName === allPlayers[i].team_name) {
            updateTeamDisplay(allPlayers[i], redTeamBackgroundImage, redTeamAverageRankNumber, "redTeamPlayer");
        } else if (currentTeamBlueName === allPlayers[i].team_name) {
            updateTeamDisplay(allPlayers[i], blueTeamBackgroundImage, blueTeamAverageRankNumber, "blueTeamPlayer");
        }
    }
}, 500)

// Reset protects
function resetProtects() {
    redTeamProtectMap.style.display = "none"
    blueTeamProtectMap.style.display = "none"
}
// Reset bans
function resetBans() {
    resetTiles(redBanTiles)
    resetTiles(blueBanTiles)
}
// Reset picks
function resetPicks() {
    resetTiles(redPickTiles)
    resetTiles(bluePickTiles)
    resetTile(tiebreakerContainer)
}
// Reset tiles
function resetTiles(tileContainer) {
    for (let i = 0; i < tileContainer.childElementCount; i++) {
        resetTile(tileContainer.children[i])
    }
}
function resetTile(tile) {
    if (tile.hasAttribute("id")) tile.removeAttribute("id")
    tile.style.boxShadow = "none"
    tile.children[8].style.display = "block"
    tile.children[8].classList.remove("mapInformationPickerCurrent")
    tile.children[8].innerText = ""

    if (tile.childElementCount > 9) {
        tile.children[9].style.display = "none"
        tile.children[10].innerText = ""
    }
}