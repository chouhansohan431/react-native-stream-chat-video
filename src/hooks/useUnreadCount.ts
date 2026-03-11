import { useEffect, useState } from "react"
import { useChatContext } from "stream-chat-react-native"

export default function useUnreadCount() {

  const { client } = useChatContext()
  const [count, setCount] = useState(0)

  useEffect(() => {

    const subscription = client.on((event) => {

      if (event.total_unread_count !== undefined) {
        setCount(event.total_unread_count)
      }

    })

    return () => subscription.unsubscribe()

  }, [client])

  return count
}