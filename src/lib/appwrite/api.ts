import { ID, Query } from "appwrite";
import { INewPost, INewUser } from "@/types";
import { account, appwriteConfig, avatars, databases, storage } from "./config";

export async function createUserAccount(user: INewUser) {
    try {
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        )

        if (!newAccount) throw Error

        const avatarUrl = avatars.getInitials(user.name)

        const newUser = await saveUserToDB({
            accountId: newAccount.$id,
            name: newAccount.name,
            email: newAccount.email,
            username: user.username,
            imageUrl: avatarUrl
        })

        return newUser;

    } catch (error) {
        console.log(error);
        return error

    }
}

export async function saveUserToDB(user: {
    accountId: string;
    email: string;
    name: string;
    imageUrl: URL;
    username?: string;
}) {
    try {
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            user,
        )
        return newUser

    } catch (error) {
        console.log(error);
    }
}

export async function signInAccount(user: { email: string; password: string }) {
    try {
        const session = await account.createEmailSession(user.email, user.password)

        return session
    } catch (error) {
        console.log(error)
    }
}

export async function getCurrentUser() {
    try {
        const currentAccount = await account.get()

        if (!currentAccount) throw Error
 
        // Dibawah ini kita perlu menambahkan ID database yang kita inginkan untuk membaca collectionId dan mengambil Query semua dokumen pengguna yang di berikan koleksi
        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId, // ==> ID Databasenya apa
            appwriteConfig.userCollectionId, // ==> ID collection yang ada di DB nya apa
            [Query.equal('accountId', currentAccount.$id)] // ==> ID user yang ada di Collection itu apa
        )

        if (!currentUser) throw Error

        return currentUser.documents[0] // ===> ambil dokumen dengan indeks ke 0

    } catch (error) {
        console.log(error);

    }
}

export async function signOutAccount() {
    try {
        const session = await account.deleteSession("current")

        return session
    } catch (error) {
        console.log(error)
    }
}

export async function createPost(post: INewPost) { 
    try {
        // Upload image to storage
        const uploadedFile = await uploadFile(post.file[0])

        if(!uploadedFile) throw Error
        
        
        // Get file url
        const fileUrl = getFilePreview(uploadedFile.$id)

        if(!fileUrl){
            // Jika tidak ada file URL nya maka filenya harus di hapus, karena pasti ada sesuatu yang rusak atau sesuatu yang tidak beres dengan fileUrl di atas.
            // Kenapa di hapus? tujuannya adalah agar tidak membebani penyimpanan
            await deleteFile(uploadedFile.$id)
            throw Error
        }


        // Convert tags in an array
        const tags = post.tags?.replace(/ /g, '').split(',') || []; // ==> mengganti semua string kosong dengan koma


        // Save POST to Database
        const newPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            ID.unique(),
            {
                creator: post.userId,
                caption: post.caption,
                imageUrl: fileUrl,
                imageId: uploadedFile.$id,
                location: post.location,
                tags: tags
            }
        )

        if(!newPost) {
            await deleteFile(uploadedFile.$id)
            throw Error
        }

        return newPost
        
    } catch (error) {
        console.log(error);
        
    }
}

export async function uploadFile(file: File) {
    try {
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            file
        );
        
        return uploadedFile
    } catch (error) {
        console.log(error);
        
    }
}

export function getFilePreview(fileId: string) {
    try {
        const fileUrl = storage.getFilePreview(
            appwriteConfig.storageId,
            fileId,
            2000, // =>> Lebar Gambar
            2000, // ==> Tinggi Gambar
            "top", // ==> Gravitasinya
            100 // ==> Ini adalah kualitasnya (100 adalah kualitas paling teratas)
        )

        if(!fileUrl) throw Error

        return fileUrl
    } catch (error) {
        console.log(error);
        
    }
}

export async function deleteFile(fileId: string) {
    try {
        await storage.deleteFile(appwriteConfig.storageId, fileId)

        return { status : 'ok'}

    } catch (error) {
        console.log(error);
    }
}

export async function getRecentPosts() {
    const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.postCollectionId,
        [Query.orderDesc('$createdAt'), Query.limit(20)] // ===> Artinya : Appwrite SDK memerlukan Query parameters untuk mengontrol perilaku dari query ke databasenya.

        // Penjelasan :
        // Query.orderDesc(`$createdAt`): Mengurutkan hasil query berdasarkan field createdAt secara descending (terbaru ke terlama).
        //  Query.limit(20) : Membatasi jumlah dokumen yang diambil maksimal 20 saja.

        // Keduanya dipasang dalam array [..] karena bisa mencantumkan banyak query builder di dalamnya.

        //  $createdAt ini merupakan field bawaan yang disediakan Appwrite di setiap dokumen, yang berisi tanggal & waktu dokumen tersebut dibuat.

        // setiap kali Appwrite menyimpan dokumen baru ke database, secara otomatis akan menambahkan beberapa field metadata, termasuk:
        // $id - ID unik dokumen
        // $createdAt - timestamp pembuatan dokumen
        // $updatedAt - timestamp terakhir update
        // dll
    )

    if(!posts) throw Error

    return posts
}

export async function likePost( postId: string, likesArray: string ) {
    try {
        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId,
            {
                likes: likesArray
            }
        )

        if(!updatedPost) throw Error

            return updatedPost

    } catch (error) {
        console.log(error);
        
    }
}

export async function savePost( userId: string, postId: string, ) {
    try {
        const updatedPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            ID.unique(),
            {
                user: userId,
                post: postId
            }
        )

        if(!updatedPost) throw Error

        return updatedPost

    } catch (error) {
        console.log(error);
        
    }
}

export async function deleteSavedPost( savedRecordId: string ) {
    try {
        const statusCode = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            savedRecordId
        )

        if(!statusCode) throw Error

        return { status: "ok" }

    } catch (error) {
        console.log(error);
        
    }
}