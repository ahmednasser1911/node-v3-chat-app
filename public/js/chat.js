const socket = io()

//elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const {username , room} = Qs.parse(location.search , { ignoreQueryPrefix: true })

const autoscroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild

    // height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    
    // visible height of scrollbar
    const visibleHeight = $messages.offsetHeight

    // height of messages container 
    const constainerHeight = $messages.scrollHeight

    // how far i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(constainerHeight - newMessageHeight <= scrollOffset)
        $messages.scrollTop = $messages.scrollHeight
}

socket.on('message' , (message) => {
    console.log( message)
    const html = Mustache.render(messageTemplate , {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend' , html)
    autoscroll()
})

socket.on('locationMessage' , (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate , {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend' , html)
    autoscroll()
})

socket.on('roomData' , ({ room , users }) => {
    const html = Mustache.render(sidebarTemplate , {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit' , (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled' , 'disabled')
    //disable
    const message = e.target.elements.msg.value
    
    socket.emit('sendMessage' , message , (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        //enable

        if(error)
            return console.log(error)

        console.log('Message delivered!')
    })
})

$locationButton.addEventListener('click' , () => {
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser!')
    }

    $locationButton.setAttribute('disabled' , 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        let location = {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }

        socket.emit('sendLocation' , location , () => {
            $locationButton.removeAttribute('disabled')
            console.log('Location is shared!')
        })
    })
})

socket.emit('join' , { username , room } , (error) => {
    if(error){
        alert(error)
        location.href = '/'
    }
})