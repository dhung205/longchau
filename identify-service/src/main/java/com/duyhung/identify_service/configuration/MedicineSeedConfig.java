package com.duyhung.identify_service.configuration;

import com.duyhung.identify_service.entity.Medicine;
import com.duyhung.identify_service.repository.MedicineRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;

@Configuration
public class MedicineSeedConfig {
    @Bean
    @ConditionalOnProperty(prefix = "spring.datasource", name = "driverClassName", havingValue = "com.mysql.cj.jdbc.Driver")
    ApplicationRunner seedMedicines(MedicineRepository repository) {
        return args -> {
            if (!repository.existsByNameIgnoreCase("Paracetamol 500 mg"))
                repository.save(make("Paracetamol 500 mg", "Paracetamol 500 mg", "Thuốc không kê đơn", "Giảm đau nhẹ đến vừa và hạ sốt.", "Dùng đúng hướng dẫn trên nhãn; tránh dùng đồng thời nhiều thuốc chứa paracetamol. Người có bệnh gan nên hỏi nhân viên y tế.", LocalDate.of(2028, 6, 30), 12000, 80));
            if (!repository.existsByNameIgnoreCase("Vitamin C 500 mg"))
                repository.save(make("Vitamin C 500 mg", "Acid ascorbic 500 mg", "Vitamin & Khoáng chất", "Bổ sung vitamin C khi chế độ ăn chưa đáp ứng nhu cầu.", "Dùng theo hướng dẫn sản phẩm. Người có tiền sử sỏi thận hoặc bệnh nền nên hỏi dược sĩ trước khi dùng.", LocalDate.of(2028, 12, 31), 18000, 45));
            if (!repository.existsByNameIgnoreCase("Nước muối sinh lý 0,9%"))
                repository.save(make("Nước muối sinh lý 0,9%", "Natri clorid 0,9%", "Chăm sóc cá nhân", "Làm sạch nhẹ nhàng vùng da hoặc mũi theo đúng mục đích ghi trên nhãn.", "Chọn sản phẩm đúng mục đích sử dụng; không dùng chai đã mở quá thời hạn hướng dẫn.", LocalDate.of(2027, 11, 30), 8000, 100));

            seedIfMissing(repository, make("Ibuprofen 200 mg", "Ibuprofen 200 mg", "Thuốc không kê đơn", "Sản phẩm giảm đau, hạ sốt theo thông tin nhãn.", "Đọc kỹ nhãn; hỏi dược sĩ nếu đang mang thai, có bệnh nền hoặc đang dùng thuốc khác.", LocalDate.of(2028, 10, 31), 24000, 55));
            seedIfMissing(repository, make("Loratadine 10 mg", "Loratadine 10 mg", "Thuốc không kê đơn", "Sản phẩm dùng cho các triệu chứng dị ứng theo hướng dẫn trên nhãn.", "Tuân thủ hướng dẫn sử dụng; hỏi dược sĩ nếu triệu chứng kéo dài hoặc đang dùng thuốc khác.", LocalDate.of(2028, 9, 30), 18000, 36));
            seedIfMissing(repository, make("Cetirizine 10 mg", "Cetirizine 10 mg", "Thuốc không kê đơn", "Sản phẩm hỗ trợ giảm triệu chứng dị ứng theo hướng dẫn trên nhãn.", "Có thể gây buồn ngủ ở một số người; đọc kỹ nhãn và hỏi dược sĩ khi cần.", LocalDate.of(2028, 8, 31), 16000, 42));
            seedIfMissing(repository, make("Oresol bù nước", "Điện giải uống", "Chăm sóc cá nhân", "Gói bù nước và điện giải, pha và sử dụng theo đúng hướng dẫn trên bao bì.", "Pha đúng lượng nước ghi trên nhãn; hỏi nhân viên y tế nếu có dấu hiệu mất nước nặng.", LocalDate.of(2028, 7, 31), 5000, 120));
            seedIfMissing(repository, make("Omeprazole 20 mg", "Omeprazole 20 mg", "Thuốc không kê đơn", "Sản phẩm hỗ trợ các vấn đề liên quan đến axit dạ dày theo nhãn.", "Sử dụng theo tư vấn của dược sĩ hoặc hướng dẫn chính thức trên bao bì.", LocalDate.of(2028, 12, 31), 32000, 30));
            seedIfMissing(repository, make("Vitamin D3 1000 IU", "Vitamin D3", "Vitamin & Khoáng chất", "Sản phẩm bổ sung vitamin D theo nhu cầu dinh dưỡng.", "Dùng theo hướng dẫn trên nhãn; hỏi dược sĩ nếu đang dùng sản phẩm bổ sung khác.", LocalDate.of(2029, 3, 31), 65000, 48));
            seedIfMissing(repository, make("Calcium D3", "Canxi và Vitamin D3", "Vitamin & Khoáng chất", "Sản phẩm bổ sung canxi và vitamin D theo thông tin sản phẩm.", "Đọc kỹ thành phần và hướng dẫn; hỏi dược sĩ nếu có bệnh nền hoặc đang dùng thuốc.", LocalDate.of(2029, 2, 28), 98000, 32));
            seedIfMissing(repository, make("Kẽm 10 mg", "Kẽm", "Vitamin & Khoáng chất", "Sản phẩm bổ sung kẽm theo thông tin trên nhãn.", "Không dùng vượt hướng dẫn của nhà sản xuất; hỏi dược sĩ nếu đang dùng thuốc khác.", LocalDate.of(2029, 1, 31), 42000, 27));
            seedIfMissing(repository, make("Multivitamin tổng hợp", "Vitamin và khoáng chất tổng hợp", "Vitamin & Khoáng chất", "Sản phẩm bổ sung vitamin và khoáng chất theo thông tin nhãn.", "Kiểm tra thành phần để tránh dùng trùng với sản phẩm bổ sung khác.", LocalDate.of(2029, 4, 30), 115000, 24));
            seedIfMissing(repository, make("Men vi sinh", "Lợi khuẩn đường ruột", "Thực phẩm chức năng", "Sản phẩm bổ sung lợi khuẩn theo thông tin nhà sản xuất.", "Bảo quản và sử dụng theo hướng dẫn trên bao bì; đây không phải thuốc điều trị.", LocalDate.of(2028, 11, 30), 89000, 40));
            seedIfMissing(repository, make("Nước súc miệng 0,12%", "Dung dịch súc miệng", "Chăm sóc cá nhân", "Sản phẩm chăm sóc răng miệng, sử dụng theo hướng dẫn trên nhãn.", "Không nuốt; dùng đúng đối tượng và thời gian hướng dẫn trên bao bì.", LocalDate.of(2028, 6, 30), 39000, 33));
            seedIfMissing(repository, make("Nhiệt kế điện tử", "Thiết bị đo nhiệt độ", "Thiết bị y tế", "Thiết bị hỗ trợ đo và theo dõi nhiệt độ cơ thể.", "Đọc hướng dẫn sử dụng và vệ sinh thiết bị theo tài liệu của nhà sản xuất.", LocalDate.of(2030, 1, 31), 135000, 18));
        };
    }

    private void seedIfMissing(MedicineRepository repository, Medicine medicine) {
        if (!repository.existsByNameIgnoreCase(medicine.getName())) repository.save(medicine);
    }

    private Medicine make(String n, String i, String c, String f, String a, LocalDate d, long price, int stock) {
        Medicine m = new Medicine();
        m.setName(n);
        m.setIngredient(i);
        m.setCategory(c);
        m.setFunctionText(f);
        m.setRecommendation(a);
        m.setExpiryDate(d);
        m.setPrice(price);
        m.setStock(stock);
        return m;
    }
}
