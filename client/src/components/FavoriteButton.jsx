import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import AuthContext from '../../context/AuthProvider';
import { Heart } from 'lucide-react';

const FavoriteButton = ({ typeId, type, size = 'medium' }) => {
    const { auth } = useContext(AuthContext);
    const userId = auth?.user.id;

    const [isFavorited, setIsFavorited] = useState(false);

    useEffect(() => {
        const checkIfFavorited = async () => {
            try {
                const response = await axios.get(`/favorites/check/${type}/${typeId}`);
                setIsFavorited(response.data.isFavorited);
            } catch (error) {
                console.error('Error fetching favorites:', error);
            }
        }

        if (userId) {
            checkIfFavorited();
        }
    }, [userId, typeId, type])

    const handleFavorite = async () => {
        // Add or remove from favorites only if user is logged in
        if (!userId) {
            toast.error('Please log in to manage favorites.');
            return;
        }

        try {
            if (isFavorited) {
                await axios.delete(`/favorites/${type}/${typeId}`);
                setIsFavorited(false);
                toast.success('Removed from favorites!');
            } else {
                await axios.post('/favorites/new', { typeId, type, userId });
                setIsFavorited(true);
                toast.success('Added to favorites!');
            }
        } catch (error) {
            console.error('Error adding to favorites:', error);
            toast.error('Failed to add to favorites.');
        }
    }

    return (
        <div>
            <Heart onClick={handleFavorite}
                fill={isFavorited ? '#c1121f' : 'none'}
                strokeWidth={isFavorited ? 0 : 2}
                size={size === 'small' ? 20 : size === 'large' ? 32 : 26}
                className={`hover:cursor-pointer transition-colors duration-300 ${isFavorited ? 'text-opacity-0' : 'text-[#343a40]'} hover:text-[#c1121f]`}
            />
        </div >
    );
};

export default FavoriteButton;