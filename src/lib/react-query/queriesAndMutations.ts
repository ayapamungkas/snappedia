import { INewPost, INewUser } from '@/types'
import {
    useQuery, // => Mengambil data
    useMutation, // => Mengubah data
    useQueryClient, // => Mengontrol cache dan query secara manual
    useInfiniteQuery // => Mengambil data infinite/pagination atau infinite scroll
} from '@tanstack/react-query'
import { createPost, createUserAccount, deleteSavedPost, getCurrentUser, getRecentPosts, likePost, savePost, signInAccount, signOutAccount } from '../appwrite/api'
import { QUERY_KEYS } from './queryKeys'

export const useCreateUserAccount = () => {
    return useMutation({
        mutationFn: (user: INewUser) => createUserAccount(user)
    })
}

export const useSignInAccount = () => {
    return useMutation({
        mutationFn: (user: {
            email: string;
            password: string;
        }) => signInAccount(user)
    })
}

export const useSignOutAccount = () => {
    return useMutation({
        mutationFn: signOutAccount
    })
}

export const useCreatePost = () => {
    const queryClient = useQueryClient()
    return useMutation ({
        mutationFn: (post: INewPost) => createPost(post),

        // Fungsi dibawah ini kan di panggil ketika fungsi mutationFn berhasil / sukses.
        onSuccess: () => {
            // Berfungsi untuk membatalkan cache query GET_RECENT_POSTS di query client. Dilakukan dengan memanggil : queryClient.invalidateQueries()

            // Gambarannya : Ketika komponen memanggil query "getRecentPosts" (dibawah) lagi, React Query akan melihat "Oh cache-nya invalid, berarti harus dihapus". Karena cache dihapus, React Query akan melakukan fetch baru ke API untuk mendapatkan data terbaru, termasuk post yang baru saja dibuat.
            queryClient.invalidateQueries({ 
                queryKey: [QUERY_KEYS.GET_RECENT_POSTS] // ====>> dengan menggunakan array, kita dapat memisahkan queryKey untuk setiap query, sehingga cache yang disimpan di dalam React Query dapat dikelola dengan lebih baik.
            })
            // Jadi intinya, tanpa invalidate cache, React Query akan terus menggunakan cache getRecentPosts Lama walaupun datanya sudah outdated. Fetch data baru hanya terjadi jika cache diinvalidate atau expired.
        }

        // Jadi intinya, alasan kita melakukan hal dia atas yaitu agar data POSTS selalu up to date, mengingat bahwa kita membuat sbeuah aplikasi Realtime

        // jika cache tidak di-invalidate, maka user harus melakukan refresh browser terlebih dahulu agar bisa mendapatkan data posts terbaru.
    })
}

// Berfungsi untuk mendapatkan postingan terbaru
export const useGetRecentPosts = () => {
    return useQuery({
        // Query key yang kita inginkan
        queryKey: [QUERY_KEYS.GET_RECENT_POSTS], // ====>> Disini Query dibuat agar bisa digunakan untuk menghapus cahce, jika tidak di buat maka pada "useCreatePost" diatas tidak akan berjalan

        // Apa yang terjadi / di eksekusi setelah mencoba melakukan fetch (mengambil) useQuery, fungsi dibawah ini akan berjalan :
        queryFn: getRecentPosts

        // Proses tampilan UI nya :
        // useGetRecentPosts akan fetch data posts dari API server.
        // Data posts yang difetch disimpan di cache React Query.
        // UI Posts akan mengambil data posts dari cache dan menampilkannya.
        // Jadi data posts di UI berasal dari cache React Query.
    
        // Setiap query React Query akan mengembalikan objek dengan properti:
        // {
        //     data: <result data>,
        //     isLoading: boolean,
        //     error: error
        //   }
        // Struktur di atas ini hanya akan di kembalikan jika menggunakan "useQuery()"

        // Makanya pada UI kita menggunakan "data.map" atau sebagainya

        // useMutation mengembalikan:
        // {
        //     mutate: Function,
        //     isLoading: Boolean
        //   }

    })
}

// export const useLikePost = () => {
//     const queryClient = useQueryClient()
//     return useMutation({
//         mutationFn: ({ postId, likesString}: { postId: string; likesString: string[] }) => {
//             const likesArray = likesString.join(',');
//             return likePost(postId, likesArray)
//         }
//     })
// }

export const useLikePost = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ postId, likesArray}: { postId: string; likesArray: string[] }) => likePost(postId, likesArray),
        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POST_BY_ID, data?.$id]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_RECENT_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_CURRENT_USER]
            })
        }
    })
}

export const useSavePost = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ userId, postId}: { userId: string; postId: string; }) => savePost(userId, postId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_RECENT_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_CURRENT_USER]
            })
            
        }
        
    })
}

export const useDeleteSavedPost = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ( savedRecordId: string ) => deleteSavedPost(savedRecordId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_RECENT_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_POSTS]
            })
            queryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.GET_CURRENT_USER]
            })
        }
    })
}

export const useGetCurrentUser = () => {
    return useQuery({
        queryKey: [QUERY_KEYS.GET_CURRENT_USER],
        queryFn: getCurrentUser
    })
} 