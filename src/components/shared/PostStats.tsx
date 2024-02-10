import React, { useEffect } from "react"
import { useDeleteSavedPost, useGetCurrentUser, useLikePost, useSavePost } from "@/lib/react-query/queriesAndMutations"
import { checkIsLiked } from "@/lib/utils"
import { Models } from "appwrite"
import { useState } from "react"

type PostStatsProps = {
    post: Models.Document
    userId: string
}


const PostStats = ({ post, userId }: PostStatsProps) => {

    const likeList = post.likes.map((user: Models.Document) => user.$id)

    const [likes, setLikes] = useState<string[]>(likeList)
    const [isSaved, setIsSaved] = useState(false)

    const { mutate: likePost } = useLikePost()
    const { mutate: savePost } = useSavePost()
    const { mutate: deleteSavedPost } = useDeleteSavedPost()

    const { data: currentUser } = useGetCurrentUser()

    const savedPostRecord = currentUser?.save.find((record: Models.Document) => record.post.$id === post.$id)

    // { saved: true } => !savedPostedRecord => !false => true
    // 'test' => !'test' => !false => true
    // '' => !'' => !true => false

    useEffect(() => {
        setIsSaved(!!savedPostRecord)
    }, [currentUser])

    const handleLikePost = (e: React.MouseEvent) => {
        e.stopPropagation();

        let newLikes = [...likes];

        const hasLike = newLikes.includes(userId)

        if (hasLike) {
            newLikes = newLikes.filter((id) => id !== userId) 
            // ==> Jika ada kondisi false (postId: string,) maka akan menghapus id yang sama dengan userId, jika ada yang tidak sama (true) maka akan di pertahankan
        } else {
            newLikes.push(userId)
        }

        setLikes(newLikes)
        likePost({ postId: post.$id, likesArray: newLikes })
    }


    const handleSavePost = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (savedPostRecord) {
            setIsSaved(false)
            deleteSavedPost(savedPostRecord.$id)
        } else {
            savePost({ userId, postId: post.$id })
            setIsSaved(true)
        }
    };

    return (
        <div className="flex justify-between items-center z-20 mt-5">
            <div className="flex gap-2 mr-5">

                <img
                    src={checkIsLiked(likes, userId) ? '/assets/icons/liked.svg' : '/assets/icons/like.svg'}
                    alt="like"
                    width={20}
                    height={20}
                    onClick={(e) => handleLikePost(e)}
                    className="cursor-pointer"
                />

                <p className="small-medium lg:base-medium">
                    {likes.length}
                </p>

            </div>
            <div className="flex gap-2">
                    <img
                        src={isSaved ? '/assets/icons/saved.svg' : '/assets/icons/save.svg'}
                        alt="like"
                        width={20}
                        height={20}
                        onClick={(e) => handleSavePost(e)}
                        className="cursor-pointer"
                    />
            </div>
        </div>
    )
}

export default PostStats