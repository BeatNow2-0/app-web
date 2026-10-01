class UserSingleton {
    private static instance: UserSingleton;
    private full_name: string;
    private username: string;
    private email: string;
    private id: string;
    public photoProfile: string;
    public is_active: boolean;

    private constructor() {
        this.full_name = '';
        this.username = '';
        this.email = '';
        this.id = '';
        this.photoProfile = '/avatar-fallback.svg';
        this.is_active = false;
    }


    public static getInstance(): UserSingleton {
        if (!UserSingleton.instance) {
            UserSingleton.instance = new UserSingleton();
        }

        return UserSingleton.instance;
    }

    public setFullName(full_name: string) {
        this.full_name = full_name;
    }

    public getFullName() {
        return this.full_name;
    }

    public setUsername(username: string) {
        this.username = username;
    }

    public getUsername() {
        return this.username;
    }

    public setEmail(email: string) {
        this.email = email;
    }

    public getEmail() {
        return this.email;
    }

    public setId(id: string) {
        this.id = id;
    }

    public getId() {
        return this.id;
    }

    public getPhotoProfile() {
        return this.photoProfile;
    }

    public setPhotoProfile(photoProfile: string) {
        this.photoProfile = photoProfile;
    }

    public setIsActive(is_active: boolean) {
        this.is_active = is_active;
    }

    public getIsActive() {
        return this.is_active;
    }



    public clear() {
        this.full_name = '';
        this.username = '';
        this.email = '';
        this.id = '';
        this.photoProfile = '/avatar-fallback.svg';
        this.is_active = false;
    }
}

export default UserSingleton;
